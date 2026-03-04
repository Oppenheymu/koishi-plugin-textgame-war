
import { Context } from "koishi";
import { requirePlayer } from "../Utils";



export function 增加资源(ctx: Context) {
    ctx.command( '增加资源 <目标> <资源类型> <数量>', { authority: 3 } )
        .action( async ( { session }, 目标, 资源类型, 数量 ) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                await ctx.database.set('malieplayer', { userId: 目标 }, { [资源类型]: 数量 });
                return `已成功将 ${目标} 的 ${资源类型} 设置为 ${数量}！`;     
            } catch (error) {
                return (error as Error).message;
            }
            
        });

    // 管理员手动为所有用户增加生产次数（仅当小于8时）
    ctx.command('增加生产次数', { authority: 3 })
        .action(async ({ session }) => {
            try {
                const players = await ctx.database.get('malieplayer', {});
                let count = 0;
                for (const p of players) {
                    const cur = p.生产次数 ?? 0;
                    if (cur < 8) {
                        await ctx.database.set('malieplayer', { userId: p.userId }, { 生产次数: cur + 1 });
                        count++;
                    }
                }
                return `为 ${count} 位玩家增加了生产次数（上限8）。`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}