import dayjs from "dayjs";
import {
    Context
} from "koishi";
import {
    MemberData
} from "@/types";
import {
    玩家检查,
    玩家联军检查,
    目标解析,
} from "@/utils";
import {
    玩家联军权限设置,
    分配坐标逻辑
} from "@/logic";

const 邀请有效期毫秒 = 3 * 60 * 1000;
const 联军地区上限 = 4;

type 联军邀请记录 = {
    联军编号: string;
    联军名称: string;
    目标用户ID: number;
    目标UID: string;
    目标用户名: string;
    邀请人用户名: string;
    过期时间戳: number;
};

const 联军邀请缓存 = new Map < string,
    联军邀请记录 > ();

function 构造邀请键(联军编号: string, 目标UID: string) {
    return `${联军编号}:${目标UID}`;
}

export function 邀请加入联军(ctx: Context) {
    ctx.command("邀请加入联军 <目标:string>")
        .alias("邀请入军")
        .alias("邀请加入国家")
        .action(async ({
            session
        }, 目标) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    "邀请加入联军"
                );
                const {
                    username,
                    联军资料,
                    联军编号
                } = await 玩家联军检查(
                    ctx,
                    session, {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    }
                );

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const {
                    目标用户ID,
                    目标用户名,
                    目标用户资料
                } = await 目标解析(
                    ctx,
                    session,
                    输入目标
                );

                const 目标UID = 目标用户资料.uid;

                if (联军资料.联军成员列表?.[目标UID]) {
                    return `${目标用户名} 同志已在本联军中`;
                }

                if (
                    目标用户资料.所在联军 &&
                    目标用户资料.所在联军 !== 联军编号
                ) {
                    return `${目标用户名} 同志已加入其他联军（${目标用户资料.所在联军}）`;
                }

                const 邀请键 = 构造邀请键(联军编号, 目标UID);
                const 当前时间戳 = Date.now();
                const 已有邀请 = 联军邀请缓存.get(邀请键);

                if (已有邀请 && 当前时间戳 < 已有邀请.过期时间戳) {
                    const 剩余秒数 = Math.ceil(
                        (已有邀请.过期时间戳 - 当前时间戳) / 1000
                    );
                    return `${目标用户名} 同志已有待确认邀请，请等待对方同意（剩余约${剩余秒数}秒）`;
                }

                const 过期时间戳 = 当前时间戳 + 邀请有效期毫秒;
                联军邀请缓存.set(邀请键, {
                    联军编号,
                    联军名称: 联军资料.联军名称,
                    目标用户ID,
                    目标UID,
                    目标用户名,
                    邀请人用户名: username,
                    过期时间戳,
                });

                const 有效分钟 = Math.floor(邀请有效期毫秒 / 60000);

                return `
====[征战文游]====
${username} 同志！
已向 ${目标用户名} 发出联军邀请。
请对方在 ${有效分钟} 分钟内发送：同意加入联军 ${联军编号}
超时后邀请自动失效。
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("同意加入联军 <联军编号:string>")
        .alias("同意入军")
        .action(async ({
            session
        }, 输入联军编号) => {
            let 新分配地区: string | null = null;

            try {
                const {
                    id,
                    uid,
                    username,
                    用户资料
                } = await 玩家检查(
                    ctx,
                    session
                );

                const 联军编号 = 输入联军编号?.trim();
                if (!联军编号) {
                    return "请提供联军编号，例如：同意加入联军 A12345";
                }

                if (用户资料.所在联军) {
                    return `你已加入联军（${用户资料.所在联军}），无法重复同意邀请`;
                }

                const 邀请键 = 构造邀请键(联军编号, uid);
                const 邀请记录 = 联军邀请缓存.get(邀请键);

                if (!邀请记录) {
                    return "未找到你的有效邀请，可能已过期或被撤销";
                }

                if (Date.now() >= 邀请记录.过期时间戳) {
                    联军邀请缓存.delete(邀请键);
                    return "邀请已过期，请让对方重新发起邀请";
                }

                const [联军资料] = await ctx.database.get("马列联军表", {
                    联军编号,
                });

                if (!联军资料) {
                    联军邀请缓存.delete(邀请键);
                    return `联军（${联军编号}）不存在，邀请已失效`;
                }

                if (联军资料.联军成员列表?.[uid]) {
                    联军邀请缓存.delete(邀请键);
                    return `你已经是 ${联军资料.联军名称} 成员，无需重复同意`;
                }

                const 新成员记录: MemberData = {
                    联军贡献: 0,
                    加入时间: dayjs().format("YYYY-M-D-H"),
                };

                const 新联军成员列表 = {
                    ...(联军资料.联军成员列表 ?? {}),
                    [uid]: 新成员记录,
                };

                const 新三级权限成员列表 = Array.from(
                    new Set([...(联军资料.联军三级权限成员列表 ?? []), uid])
                );

                const 新成员数量 = Object.keys(新联军成员列表).length;

                const 原有地区列表 = 联军资料.联军地区列表 ?? [];
                let 新联军地区列表 = [...原有地区列表];
                let 地区分配提示 = "";

                if (原有地区列表.length < 联军地区上限) {
                    const 地区分配结果 = await 分配坐标逻辑(ctx, 联军资料.id);
                    if (地区分配结果 !== "所有地区已领完！") {
                        新分配地区 = 地区分配结果;
                        if (!新联军地区列表.includes(新分配地区)) {
                            新联军地区列表.push(新分配地区);
                        }
                        地区分配提示 = `\n■ 新分配地区：${新分配地区}`;
                    } else {
                        地区分配提示 = "\n■ 地区分配：当前无可分配新地区";
                    }
                } else {
                    地区分配提示 = `\n■ 地区分配：已达到上限（${联军地区上限}块）`;
                }

                await Promise.all([
                    ctx.database.set(
                        "马列联军表", {
                            联军编号
                        }, {
                            联军成员列表: 新联军成员列表,
                            联军三级权限成员列表: 新三级权限成员列表,
                            联军成员数量: 新成员数量,
                            联军地区列表: 新联军地区列表,
                        }
                    ),
                    ctx.database.set(
                        "马列玩家表", {
                            id
                        }, {
                            所在联军: 联军编号,
                            驻扎地区: 用户资料.驻扎地区 ||
                                新分配地区 ||
                                联军资料.联军首都 ||
                                新联军地区列表[0] ||
                                null,
                        }
                    ),
                ]);

                联军邀请缓存.delete(邀请键);

                return `
====[征战文游]====
${username} 同志！
你已同意邀请并加入联军：${联军资料.联军名称}
■ 联军编号：${联军编号}${地区分配提示}
`.trim();
            } catch (error) {
                if (新分配地区) {
                    try {
                        await ctx.database.set(
                            "马列地区状态机", {
                                地区编号: 新分配地区
                            }, {
                                地区归属国: null,
                                是否已分配: false,
                            } as any
                        );
                    } catch {}
                }

                return (error as Error).message;
            }
        });
}
