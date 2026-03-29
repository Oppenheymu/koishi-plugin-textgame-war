import { Context, Session } from "koishi";
import { 玩家检查 } from "../../../Utils/用户检查";

export function 我的账户配置(ctx: Context) {
    ctx.command("我的账户配置")
        .alias("我的账号")
        .alias("我的账号配置")
        .alias("我的配置")
        .action(async ({ session }) => {
            try {
                const { 用户配置 } = await 玩家检查(ctx, session);
                return `
===[征战文游]===
${用户配置.username} 同志！
以下是你的账号配置：
UID: ${用户配置.uid}
QQ: ${用户配置.onebot ?? "未绑定"}
TG: ${用户配置.telegram ?? "未绑定"}
Discord: ${用户配置.discord ?? "未绑定"}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
