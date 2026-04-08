import { Context } from "koishi";
import {
    获取联军权限等级,
    目标解析,
    玩家联军检查,
    玩家联军权限设置,
} from "../../../utils";

export function 移出联军(ctx: Context) {
    ctx.command("移出联军 <目标:string>")
        .alias("踢出联军")
        .action(async ({ session }, 目标) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, "移出联军");
                const { uid, username, 联军资料, 联军编号, 权限等级 } = await 玩家联军检查(
                    ctx,
                    session,
                    {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    },
                );

                const 输入目标 = 目标?.trim();
                if (!输入目标) {
                    return "请指定目标用户：可以 @对方 或输入 UID";
                }

                const { 目标用户ID, 目标用户名, 目标用户资料 } = await 目标解析(
                    ctx,
                    session,
                    输入目标,
                );

                const 目标UID = 目标用户资料.uid;
                if (目标UID === uid) {
                    return "不能移出自己";
                }

                if (目标用户资料.所在联军 !== 联军编号) {
                    return `${目标用户名} 同志不在你的联军中`;
                }

                if (!联军资料.联军成员列表?.[目标UID]) {
                    return `${目标用户名} 同志不在联军成员列表中`;
                }

                if (联军资料.联军元首 === 目标UID) {
                    return "不能移出联军元首";
                }

                const 目标权限等级 = 获取联军权限等级(联军资料, 目标UID);
                if (权限等级 >= 目标权限等级) {
                    return "权限不足，不能移出同级或更高权限成员";
                }

                const 新联军成员列表 = { ...(联军资料.联军成员列表 ?? {}) };
                delete 新联军成员列表[目标UID];

                const 过滤成员 = (列表: string[] = []) => 列表.filter((成员) => 成员 !== 目标UID);

                await Promise.all([
                    ctx.database.set(
                        "马列联军表",
                        { 联军编号 },
                        {
                            联军成员列表: 新联军成员列表,
                            联军成员数量: Object.keys(新联军成员列表).length,
                            联军一级权限成员列表: 过滤成员(联军资料.联军一级权限成员列表),
                            联军二级权限成员列表: 过滤成员(联军资料.联军二级权限成员列表),
                            联军三级权限成员列表: 过滤成员(联军资料.联军三级权限成员列表),
                        },
                    ),
                    ctx.database.set(
                        "马列玩家表",
                        { id: 目标用户ID },
                        {
                            所在联军: null,
                        },
                    ),
                ]);

                return `
====[征战文游]====
${username} 同志！
已将 ${目标用户名} 移出联军
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
