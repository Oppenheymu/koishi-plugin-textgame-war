import {
    Context
} from "koishi";
import {
    联军政体
} from "@/types";
import {
    目标解析,
    玩家联军检查,
} from "@/utils";
import {
    获取联军成员权限等级,
    设置成员权限等级
} from "@/logic"



function 解析权限等级输入(输入: number): 1 | 2 | 3 | 4 | null {
    if (!Number.isInteger(输入)) {
        return null;
    }

    if (输入 < 1 || 输入 > 4) {
        return null;
    }

    return 输入 as 1 | 2 | 3 | 4;
}

export function 提权(ctx: Context) {
    ctx.command("设置权限等级 <目标:string> <权限等级:number>")
        .alias("提权")
        .alias("降权")
        .alias("设置成员权限")
        .action(async ({
            session
        }, 目标, 权限等级) => {
            try {
                const {
                    uid,
                    username,
                    联军资料,
                    联军编号
                } =
                await 玩家联军检查(ctx, session, {
                    最低权限等级: 4,
                    是否必须在成员列表: true,
                });

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const 输入等级 = 解析权限等级输入(权限等级);
                if (输入等级 === null) {
                    return "权限等级必须是 1 到 4 的整数";
                }

                if (输入等级 === 4) {
                    return "4级权限属于元首/总理职务，请使用设置元首或设置总理";
                }

                const {
                    目标用户名,
                    目标用户资料
                } = await 目标解析(
                    ctx,
                    session,
                    输入目标
                );

                const 目标UID = 目标用户资料.uid;
                if (目标UID === uid) {
                    return "不能设置自己的权限等级";
                }

                if (目标用户资料.所在联军 !== 联军编号) {
                    return `${目标用户名} 同志不在你的联军中`;
                }

                const 目标当前权限等级 = 获取联军成员权限等级(
                    联军资料,
                    目标UID
                );

                if (联军资料.联军政治体制 === 联军政体.民主制) {
                    return "民主制下禁止手动设置成员权限等级";
                }

                if (联军资料.联军政治体制 === 联军政体.威权制) {
                    if (目标当前权限等级 === 4) {
                        return "威权制下不能调整四级权限成员的权限";
                    }
                }

                const 权限列表更新 = 设置成员权限等级(
                    联军资料,
                    目标UID,
                    输入等级
                );

                await ctx.database.set(
                    "马列联军表", {
                        联军编号
                    },
                    权限列表更新
                );

                return `
====[征战文游]====
${username} 同志！
已将 ${目标用户名} 的权限设置为 ${输入等级} 级
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
