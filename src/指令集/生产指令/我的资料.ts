import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";



export function 我的资料(ctx: Context) {
    ctx.command('我的资料')
        .action(async ({ session }) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;
                return `
===[征战文游]===
${username} 同志：
■ 生活资料：${用户资料.生活资料}
■ 我的工人：${用户资料.工人}
■ 科技等级：${用户资料.科技等级}
■ 军队：${用户资料.私人军队}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}