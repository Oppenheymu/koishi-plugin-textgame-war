import type { Context } from "koishi";
import { 格式化 } from "#shared/format";
import { 玩家检查 } from "#ctx/player/domain/守卫";

export function 我的地下弹药库(ctx: Context) {
    ctx.command("我的地下弹药库")
        .alias("我的弹药库")
        .alias("弹药库")
        .action(async ({ session }) => {
            try {
                const { username, 用户资料 } = await 玩家检查(ctx, session);

                // 格式化数字显示

                return `
====[地下弹药库]====
${username} 同志：
■ 地下火箭弹：${格式化(用户资料.地下火箭弹)}
■ 地下防空弹药：${格式化(用户资料.地下防空弹药)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
