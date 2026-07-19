import type { Context } from "koishi";
import { 玩家检查 } from "#/utils/index";

export function 我的科技(ctx: Context) {
    ctx.command("我的科技").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            const 科技池进度 = Math.floor(
                (用户资料.科技池投入 / 用户资料.科技池容量) * 100,
            );

            return `
===[征战文游]===
${username} 同志：
■ 科技等级：${格式化(用户资料.科技等级)}
■ 科技蓝图：${格式化(用户资料.科技蓝图)}
■ 科技池进度：${科技池进度}%
■ 科技池容量：${格式化(用户资料.科技池容量)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
