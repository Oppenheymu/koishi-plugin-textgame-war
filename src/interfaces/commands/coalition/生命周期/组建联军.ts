import dayjs from "dayjs";
import type { Context } from "koishi";
import { TRandom, 获取联军Sqids } from "#/infrastructure";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon/联军";
import { 创建改名审核工单, 检查名称是否重复 } from "#ctx/naming/工单服务";
import { 分配坐标逻辑 } from "#ctx/region/domain/分配地区";
import { 检查违禁词 } from "#shared/profanity/检查违禁词";
import type { CoalitionArmy, MemberData } from "#ctx/coalition/domain/types/联军数据类型";
import { 联军政体 } from "#ctx/coalition/domain/types/联军数据类型";
import { 玩家检查 } from "#ctx/player/domain/守卫";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";

async function 校验小号身份(ctx: Context, session: unknown): Promise<string | null> {
    const amIAlt服务 = (
        ctx as Context & {
            amIAlt?: {
                isAlt: (session: unknown) => Promise<boolean>;
            };
        }
    ).amIAlt;

    if (amIAlt服务 && (await amIAlt服务.isAlt(session)) === true) {
        return "疑似小号禁止组建联军";
    }

    return null;
}

function 校验名称非空(
    联军名称: string | undefined,
    username: string,
): { 规范联军名称: string } | string {
    const 规范联军名称 = 联军名称?.trim();
    if (!规范联军名称) {
        return `
=====[国家]=====
${username} 同志！
请提供国家名称。
如：组建国家 共和国
`.trim();
    }

    return { 规范联军名称 };
}

async function 校验玩家可组建联军(
    ctx: Context,
    uid: string,
    username: string,
    用户资料: 玩家完整资料,
): Promise<string | null> {
    if (用户资料.所在联军) {
        return `
=====[国家]=====
${username} 同志！
你已加入联军（${用户资料.所在联军}），无法重复组建。
`.trim();
    }

    const [已创建联军] = await ctx.database.get(
        "马列联军表",
        {
            联军元首: uid,
        },
        ["联军编号", "联军名称"],
    );

    if (已创建联军) {
        return `
=====[国家]=====
${username} 同志！
你已组建过联军（${已创建联军.联军名称} / ${已创建联军.联军编号}）。
`.trim();
    }

    return null;
}

async function 校验名称合规(
    ctx: Context,
    规范联军名称: string,
    username: string,
): Promise<string | null> {
    if (规范联军名称.length < 2 || 规范联军名称.length > 12) {
        return `
=====[国家]=====
${username} 同志！
国名须在2到12字符间
`.trim();
    }

    const 合法字符 = /^[\u4e00-\u9fa5]+$/;
    if (!合法字符.test(规范联军名称)) {
        return `
======[国家]=====
${username} 同志！
国家名称只能包含中文。
`.trim();
    }

    const 命中违禁词 = 检查违禁词(规范联军名称);
    if (命中违禁词) {
        return `国家名称包含不允许的词语`;
    }

    const 重名类型 = await 检查名称是否重复(ctx, 规范联军名称);
    if (重名类型) {
        return `
=====[国家]=====
${username} 同志！
该国家名称已被${重名类型}使用，请更换名称。
`.trim();
    }

    return null;
}

async function 分配建国地区(
    ctx: Context,
    新联军id: number,
    新联军编号: string,
): Promise<{ 新地区: string } | null> {
    const 地区分配结果 = await 分配坐标逻辑(ctx, 新联军id, 新联军编号);

    if (!地区分配结果 || 地区分配结果 === "所有地区已领完！") {
        await ctx.database.remove("马列联军表", {
            id: 新联军id,
        });
        return null;
    }

    return { 新地区: 地区分配结果 };
}

function 构造新联军数据(输入: {
    uid: string;
    规范联军名称: string;
    新联军编号: string;
    新地区: string;
}): Omit<CoalitionArmy, "id"> {
    const now = dayjs().format("YYYY-M-D-H");

    const 用户: MemberData = {
        联军贡献: 0,
        加入时间: now,
    };

    return {
        联军元首: 输入.uid,
        联军编号: 输入.新联军编号,
        联军名称: 输入.规范联军名称,
        联军总理: "",
        联军四级权限成员列表: [输入.uid],
        联军三级权限成员列表: [],
        联军二级权限成员列表: [],
        联军一级权限成员列表: [],
        联军政治体制: 联军政体.民主制,
        联军成员数量: 1,
        联军成员列表: {
            [输入.uid]: 用户,
        },
        联军首都: 输入.新地区,
        联军地区列表: [输入.新地区],
        联军军队: TRandom(100, 300, 500),
        联军生活资料: TRandom(300, 1000, 2000),
        生活资料分配记录: [],
        联军宣称人口: 0,
        联军宣称兵力: 0,
        扩军计划: undefined,
        当天扩军累计: 0,
        联军税率: 0,
        当天内资本增量: 0,
        三天内资本增量: 0,
        七天内资本增量: 0,
        资本增量历史记录: [],
        名称是否审核: false,
        建立日期: now,
        上次改名日期: now,
    };
}

async function 写入联军创建数据(
    ctx: Context,
    {
        新联军id,
        新联军数据,
        玩家ID,
        用户资料,
        新联军编号,
    }: {
        新联军id: number;
        新联军数据: Omit<CoalitionArmy, "id">;
        玩家ID: number;
        用户资料: 玩家完整资料;
        新联军编号: string;
    },
): Promise<void> {
    await Promise.all([
        ctx.database.set(
            "马列联军表",
            {
                id: 新联军id,
            },
            新联军数据,
        ),
        ctx.database.set(
            "马列玩家表",
            {
                id: 玩家ID,
            },
            {
                所在联军: 新联军编号,
                曾加入联军列表: [...new Set([...(用户资料.曾加入联军列表 ?? []), 新联军编号])],
            },
        ),
    ]);
}

async function 回滚联军组建(
    ctx: Context,
    新联军id: number | null,
    新地区: string | null,
): Promise<void> {
    try {
        await Promise.all([
            新联军id !== null
                ? ctx.database.remove("马列联军表", {
                      id: 新联军id,
                  })
                : Promise.resolve(),
            新地区
                ? Promise.all([
                      ctx.database.set(
                          "马列地区状态机",
                          {
                              地区编号: 新地区,
                          },
                          {
                              地区归属国: null,
                              是否已分配: false,
                          },
                      ),
                      ctx.database.set(
                          "马列地区表",
                          {
                              地区编号: 新地区,
                          },
                          {
                              控制国家: "",
                          },
                      ),
                  ])
                : Promise.resolve(),
        ]);
    } catch {}
}

export function 组建联军(ctx: Context) {
    ctx.command("组建联军 <联军名称:string>")
        .alias("组建国家")
        .alias("创建国家")
        .alias("建国")
        .action(async ({ session }, 联军名称) => {
            let 新联军id: number | null = null;
            let 新地区: string | null = null;

            try {
                const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

                const 小号提示 = await 校验小号身份(ctx, session);
                if (小号提示) {
                    return 小号提示;
                }

                const 名称校验结果 = 校验名称非空(联军名称, username);
                if (typeof 名称校验结果 === "string") {
                    return 名称校验结果;
                }
                const { 规范联军名称 } = 名称校验结果;

                const 资格提示 = await 校验玩家可组建联军(ctx, uid, username, 用户资料);
                if (资格提示) {
                    return 资格提示;
                }

                const 名称提示 = await 校验名称合规(ctx, 规范联军名称, username);
                if (名称提示) {
                    return 名称提示;
                }

                const 新联军配置 = await ctx.database.create("马列联军表", {});
                新联军id = 新联军配置.id;

                const 新联军编号 = `A${获取联军Sqids().encode([新联军id])}`;
                const 地区分配 = await 分配建国地区(ctx, 新联军id, 新联军编号);
                if (!地区分配) {
                    return "地区已全部分配完毕，暂时无法组建联军。";
                }
                新地区 = 地区分配.新地区;

                const 新联军数据 = 构造新联军数据({
                    uid,
                    规范联军名称,
                    新联军编号,
                    新地区,
                });

                await 写入联军创建数据(ctx, {
                    新联军id,
                    新联军数据,
                    玩家ID: id,
                    用户资料,
                    新联军编号,
                });

                const { 工单编号 } = await 创建改名审核工单(ctx, {
                    类型: "联军",
                    新名称: 规范联军名称,
                    申请人ID: id,
                    申请人UID: uid,
                    申请人名称: username,
                    联军编号: 新联军编号,
                });

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号: 新联军编号,
                    通报标题: "联军建国通报",
                    通报内容: `${username} 成功组建新联军（待改名审核）`,
                });

                return `
====[征战文游]====
联军组建成功！
□ 联军名称: ***
□ 联军编号: ${新联军编号}
□ 审核工单: #${工单编号}（待审核）

分配的地区: ${新地区}
`.trim();
            } catch (error) {
                await 回滚联军组建(ctx, 新联军id, 新地区);
                return (error as Error).message;
            }
        });
}
