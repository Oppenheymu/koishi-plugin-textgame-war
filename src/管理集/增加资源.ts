
import { Context } from "koishi";
import { 用户检查 } from "../Utils";



export function 设置资源(ctx: Context) {
    ctx.command( '设置资源 <目标> <资源类型> <数量>', { authority: 3 } )
        .action( async ( { session }, 目标, 资源类型, 数量 ) => {
            try {


                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                await ctx.database.set('malieplayer', { uid: 目标 }, { [资源类型]: 数量 });
                return `已成功将 ${目标} 的 ${资源类型} 设置为 ${数量}！`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
