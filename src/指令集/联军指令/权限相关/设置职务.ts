import { Context } from "koishi";
import { 联军政体 } from "../../../types";
import {
    获取联军成员权限等级,
    目标解析,
    玩家联军检查,
} from "../../../utils";

function 校验目标是本联军成员(目标联军编号: string | null, 联军编号: string): boolean {
    return 目标联军编号 === 联军编号;
}

export function 设置职务(ctx: Context) {
    ctx.command("设置总理 <目标:string>")
        .action(async ({ session }, 目标) => {
            try {
                const { uid, username, 联军资料, 联军编号, 权限等级 } =
                    await 玩家联军检查(ctx, session, {
                        最低权限等级: 4,
                        是否必须在成员列表: true,
                    });

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const { 目标用户名, 目标用户资料 } = await 目标解析(
                    ctx,
                    session,
                    输入目标
                );

                const 目标UID = 目标用户资料.uid;
                if (目标UID === uid) {
                    return "不能设置自己为目标";
                }

                if (!校验目标是本联军成员(目标用户资料.所在联军, 联军编号)) {
                    return `${目标用户名} 同志不在你的联军中`;
                }

                const 目标权限等级 = 获取联军成员权限等级(联军资料, 目标UID);

                if (联军资料.联军政治体制 === 联军政体.民主制) {
                    if (权限等级 < 4) {
                        return "民主制下仅四级权限成员可以设置总理";
                    }
                    if (目标权限等级 < 3) {
                        return "民主制下，总理目标至少需要三级权限";
                    }
                } else if (联军资料.联军政治体制 === 联军政体.威权制) {
                    if (权限等级 < 4) {
                        return "威权制下仅四级权限成员可以设置总理";
                    }
                    if (目标权限等级 !== 4) {
                        return "威权制下，只能设置四级权限成员为总理";
                    }
                } else {
                    if (联军资料.联军元首 !== uid) {
                        return "极权制下，仅元首可以设置总理";
                    }
                }

                await ctx.database.set(
                    "马列联军表",
                    { 联军编号 },
                    {
                        联军总理: 目标UID,
                    }
                );

                return `
====[征战文游]====
${username} 同志！
已将 ${目标用户名} 设置为联军总理
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("设置元首 <目标:string>")
        .action(async ({ session }, 目标) => {
            try {
                const { uid, username, 联军资料, 联军编号, 权限等级 } =
                    await 玩家联军检查(ctx, session, {
                        最低权限等级: 4,
                        是否必须在成员列表: true,
                    });

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const { 目标用户名, 目标用户资料 } = await 目标解析(
                    ctx,
                    session,
                    输入目标
                );

                const 目标UID = 目标用户资料.uid;
                if (目标UID === uid) {
                    return "不能设置自己为目标";
                }

                if (!校验目标是本联军成员(目标用户资料.所在联军, 联军编号)) {
                    return `${目标用户名} 同志不在你的联军中`;
                }

                const 目标权限等级 = 获取联军成员权限等级(联军资料, 目标UID);

                if (联军资料.联军政治体制 === 联军政体.民主制) {
                    if (权限等级 < 4) {
                        return "民主制下仅四级权限成员可以设置元首";
                    }
                    if (目标权限等级 !== 4) {
                        return "民主制下，只能设置四级权限成员为元首";
                    }
                } else if (联军资料.联军政治体制 === 联军政体.威权制) {
                    if (权限等级 < 4) {
                        return "威权制下仅四级权限成员可以设置元首";
                    }
                    if (目标权限等级 !== 4) {
                        return "威权制下，只能设置四级权限成员为元首";
                    }
                } else {
                    if (联军资料.联军元首 !== uid) {
                        return "极权制下，仅元首可以设置元首";
                    }
                }

                await ctx.database.set(
                    "马列联军表",
                    { 联军编号 },
                    {
                        联军元首: 目标UID,
                    }
                );

                return `
====[征战文游]====
${username} 同志！
已将 ${目标用户名} 设置为联军元首
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
