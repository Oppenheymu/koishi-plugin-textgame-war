import type { Context } from "koishi";
import { 格式化 } from "#/utils";
import { 玩家检查 } from "../../../../utils/index.js";

export function 我的地下工厂(ctx: Context) {
    ctx.command("我的地下工厂").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            return `
====[地下工厂]====
${username} 同志：
■ 地下工人：${格式化(用户资料.地下工人)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
