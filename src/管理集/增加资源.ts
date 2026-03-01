
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
}