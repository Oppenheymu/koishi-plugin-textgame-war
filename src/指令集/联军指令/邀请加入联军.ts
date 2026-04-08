import dayjs from "dayjs";
import { Context } from "koishi";
import { MemberData } from "../../types";
import { 玩家联军检查, 目标解析 } from "../../utils";

export function 邀请加入联军(ctx: Context) {
    ctx.command("邀请加入联军 <目标:string>")
        .alias("邀请入军")
        .alias("邀请加入国家")
        .action(async ({ session }, 目标) => {
            try {
                
                const { username, 联军资料, 联军编号 } = await 玩家联军检查(
                    ctx,
                    session,
                    {
                        最低权限等级: 2,
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

                if (联军资料.联军成员列表?.[目标UID]) {
                    return `${目标用户名} 同志已在本联军中`;
                }

                if (目标用户资料.所在联军 && 目标用户资料.所在联军 !== 联军编号) {
                    return `${目标用户名} 同志已加入其他联军（${目标用户资料.所在联军}）`;
                }

                const 新成员记录: MemberData = {
                    联军贡献: 0,
                    加入时间: dayjs().format("YYYY-M-D-H"),
                };

                const 新联军成员列表 = {
                    ...(联军资料.联军成员列表 ?? {}),
                    [目标UID]: 新成员记录,
                };

                const 新三级权限成员列表 = Array.from(
                    new Set([...(联军资料.联军三级权限成员列表 ?? []), 目标UID]),
                );

                const 新成员数量 = Object.keys(新联军成员列表).length;

                await Promise.all([
                    ctx.database.set(
                        "马列联军表",
                        { 联军编号 },
                        {
                            联军成员列表: 新联军成员列表,
                            联军三级权限成员列表: 新三级权限成员列表,
                            联军成员数量: 新成员数量,
                        },
                    ),
                    ctx.database.set(
                        "马列玩家表",
                        { id: 目标用户ID },
                        {
                            所在联军: 联军编号,
                            驻扎地区: 目标用户资料.驻扎地区 || 联军资料.联军首都 || null,
                        },
                    ),
                ]);

                return `
====[征战文游]====
${username} 同志！
邀请成功：${目标用户名} 已加入联军
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
