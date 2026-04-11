import { Context } from "koishi";
import { 玩家联军检查, 玩家联军权限设置 } from "../../../utils";

export function 地区列表(ctx: Context) {
    ctx.command("地区列表")
        .alias("联军地区列表")
        .alias("国家地区列表")
        .alias("联军地区")
        .alias("国家地区")
        .action(async ({ session }, 目标) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    "地区列表"
                );
                const { username, 联军资料 } = await 玩家联军检查(
                    ctx,
                    session,
                    {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    }
                );

                return `
====[征战文游]====
${username} 同志：
联军地区列表:
    - ${联军资料.联军地区列表.join("\n")}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
