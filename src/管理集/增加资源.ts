
import { Context } from "koishi";
import { 目标解析 } from "../Utils";



export function 设置资源(ctx: Context) {
    ctx.command( '设置资源 <目标> <资源类型> <数量>', { authority: 3 } )
        .action( async ( { session }, 目标, 资源类型, 数量 ) => {
            try {

                const { 目标用户ID } = await 目标解析(ctx, session, 目标);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                await ctx.database.set('malieplayer', { id: 目标用户ID }, { [资源类型]: 数量 });
                if ( typeof 数量 === "number" ) return `成功将 ${目标} 的 ${资源类型} 设置为 ${格式化(数量)}`;
                if ( typeof 数量 === "boolean" ) return `成功将 ${目标} 的 ${资源类型} 设置为 ${数量}`;


            } catch (error) {
                return (error as Error).message;
            }
        });
}
