import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";



export function 我的科技(ctx: Context) {
    ctx.command('我的科技')
        .action(async ({ session }) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;
                const 科技池进度 = Math.floor((用户资料.科技池投入/用户资料.科技池容量) * 100)
                return `
===[征战文游]===
${username} 同志：
■ 科技等级：${用户资料.科技等级}
■ 科技蓝图：${用户资料.科技蓝图}
■ 科技池进度：${科技池进度}%
■ 科技池容量：${用户资料.科技池容量}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}