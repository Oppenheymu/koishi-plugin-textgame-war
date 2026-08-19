import dayjs from "dayjs";
import type { Context } from "koishi";
import { 构造邀请键, 联军邀请缓存 } from "#/interfaces/commands/coalition/生命周期/共享";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon";
import type { CoalitionArmy, MemberData } from "#ctx/coalition";
import { 玩家检查 } from "#ctx/player";
import { 分配坐标逻辑 } from "#ctx/region";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";

const 联军地区上限 = 4;

type 联军成员更新数据 = {
    新联军成员列表: Record<string, MemberData>;
    新三级权限成员列表: string[];
    新成员数量: number;
};

type 地区分配结果 = {
    新分配地区: string | null;
    新联军地区列表: string[];
    地区分配提示: string;
};

type 写入加入联军数据参数 = {
    联军编号: string;
    玩家ID: number;
    用户资料: 玩家完整资料;
    联军资料: CoalitionArmy;
    成员更新数据: 联军成员更新数据;
    新分配地区: string | null;
    新联军地区列表: string[];
};

function 校验同意邀请资格(
    输入联军编号: string | undefined,
    用户资料: 玩家完整资料,
): { 联军编号: string } | string {
    const 联军编号 = 输入联军编号?.trim();
    if (!联军编号) {
        return "请提供联军编号，例如：同意加入联军 A12345";
    }

    if (用户资料.所在联军) {
        return `你已加入联军（${用户资料.所在联军}），无法重复同意邀请`;
    }

    return { 联军编号 };
}

function 校验邀请记录(联军编号: string, uid: string): string | null {
    const 邀请键 = 构造邀请键(联军编号, uid);
    const 邀请记录 = 联军邀请缓存.get(邀请键);

    if (!邀请记录) {
        return "未找到你的有效邀请，可能已过期或被撤销";
    }

    if (Date.now() >= 邀请记录.过期时间戳) {
        联军邀请缓存.delete(邀请键);
        return "邀请已过期，请让对方重新发起邀请";
    }

    return null;
}

async function 查询联军并校验成员身份(
    ctx: Context,
    联军编号: string,
    uid: string,
): Promise<CoalitionArmy | string> {
    const [联军资料] = await ctx.database.get("马列联军表", {
        联军编号,
    });

    if (!联军资料) {
        联军邀请缓存.delete(构造邀请键(联军编号, uid));
        return `联军（${联军编号}）不存在，邀请已失效`;
    }

    if (联军资料.联军成员列表?.[uid]) {
        联军邀请缓存.delete(构造邀请键(联军编号, uid));
        return `你已经是 ${联军资料.联军名称} 成员，无需重复同意`;
    }

    return 联军资料;
}

function 构造联军成员更新数据(联军资料: CoalitionArmy, uid: string): 联军成员更新数据 {
    const 新成员记录: MemberData = {
        联军贡献: 0,
        加入时间: dayjs().format("YYYY-M-D-H"),
    };

    const 新联军成员列表 = {
        ...(联军资料.联军成员列表 ?? {}),
        [uid]: 新成员记录,
    };

    const 新三级权限成员列表 = Array.from(new Set([...(联军资料.联军三级权限成员列表 ?? []), uid]));

    const 新成员数量 = Object.keys(新联军成员列表).length;

    return {
        新联军成员列表,
        新三级权限成员列表,
        新成员数量,
    };
}

async function 分配新成员地区(
    ctx: Context,
    联军资料: CoalitionArmy,
    联军编号: string,
    用户资料: 玩家完整资料,
): Promise<地区分配结果> {
    const 原有地区列表 = 联军资料.联军地区列表 ?? [];
    const 新联军地区列表 = [...原有地区列表];
    let 新分配地区: string | null = null;
    let 地区分配提示 = "";

    const 曾加入本联军 = (用户资料.曾加入联军列表 ?? []).includes(联军编号);

    if (原有地区列表.length < 联军地区上限 && !曾加入本联军) {
        const 地区分配结果 = await 分配坐标逻辑(ctx, 联军资料.id, 联军编号);
        if (地区分配结果 && 地区分配结果 !== "所有地区已领完！") {
            新分配地区 = 地区分配结果;
            if (!新联军地区列表.includes(新分配地区)) {
                新联军地区列表.push(新分配地区);
            }
            地区分配提示 = `\n■ 新分配地区：${新分配地区}`;
        } else {
            地区分配提示 = "\n■ 地区分配：当前无可分配新地区";
        }
    } else if (曾加入本联军) {
        地区分配提示 = "\n■ 地区分配：你曾加入过本联军，不再触发新地区分配";
    } else {
        地区分配提示 = `\n■ 地区分配：已达到上限（${联军地区上限}块）`;
    }

    return { 新分配地区, 新联军地区列表, 地区分配提示 };
}

async function 写入加入联军数据(
    ctx: Context,
    {
        联军编号,
        玩家ID,
        用户资料,
        联军资料,
        成员更新数据,
        新分配地区,
        新联军地区列表,
    }: 写入加入联军数据参数,
): Promise<void> {
    await Promise.all([
        ctx.database.set(
            "马列联军表",
            {
                联军编号,
            },
            {
                联军成员列表: 成员更新数据.新联军成员列表,
                联军三级权限成员列表: 成员更新数据.新三级权限成员列表,
                联军成员数量: 成员更新数据.新成员数量,
                联军地区列表: 新联军地区列表,
            },
        ),
        ctx.database.set(
            "马列玩家表",
            {
                id: 玩家ID,
            },
            {
                所在联军: 联军编号,
                曾加入联军列表: [...new Set([...(用户资料.曾加入联军列表 ?? []), 联军编号])],
                驻扎地区:
                    用户资料.驻扎地区 ||
                    新分配地区 ||
                    联军资料.联军首都 ||
                    新联军地区列表[0] ||
                    null,
            },
        ),
    ]);
}

async function 回滚新分配地区(ctx: Context, 新分配地区: string): Promise<void> {
    try {
        await Promise.all([
            ctx.database.set(
                "马列地区状态机",
                {
                    地区编号: 新分配地区,
                },
                {
                    地区归属国: null,
                    是否已分配: false,
                },
            ),
            ctx.database.set(
                "马列地区表",
                {
                    地区编号: 新分配地区,
                },
                {
                    控制国家: "",
                },
            ),
        ]);
    } catch {}
}

export function 同意加入联军(ctx: Context) {
    ctx.command("同意加入联军 <联军编号:string>")
        .alias("同意入军")
        .action(async ({ session }, 输入联军编号) => {
            let 新分配地区: string | null = null;

            try {
                const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

                const 资格校验结果 = 校验同意邀请资格(输入联军编号, 用户资料);
                if (typeof 资格校验结果 === "string") {
                    return 资格校验结果;
                }

                const { 联军编号 } = 资格校验结果;

                const 邀请错误提示 = 校验邀请记录(联军编号, uid);
                if (邀请错误提示) {
                    return 邀请错误提示;
                }

                const 联军查询结果 = await 查询联军并校验成员身份(ctx, 联军编号, uid);
                if (typeof 联军查询结果 === "string") {
                    return 联军查询结果;
                }

                const 联军资料 = 联军查询结果;
                const 成员更新数据 = 构造联军成员更新数据(联军资料, uid);
                const 地区分配结果 = await 分配新成员地区(ctx, 联军资料, 联军编号, 用户资料);

                新分配地区 = 地区分配结果.新分配地区;

                await 写入加入联军数据(ctx, {
                    联军编号,
                    玩家ID: id,
                    用户资料,
                    联军资料,
                    成员更新数据,
                    新分配地区,
                    新联军地区列表: 地区分配结果.新联军地区列表,
                });

                联军邀请缓存.delete(构造邀请键(联军编号, uid));

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: "联军人事通报",
                    通报内容: `${username} 已同意邀请并加入联军`,
                });

                return `
====[征战文游]====
${username} 同志！
你已同意邀请并加入联军：${联军资料.联军名称}
■ 联军编号：${联军编号}${地区分配结果.地区分配提示}
`.trim();
            } catch (error) {
                if (新分配地区) {
                    await 回滚新分配地区(ctx, 新分配地区);
                }

                return (error as Error).message;
            }
        });
}
