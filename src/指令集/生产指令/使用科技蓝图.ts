import { Context } from 'koishi';
import { 玩家检查 } from '../../Utils';



export function 使用科技蓝图(ctx: Context) {

    ctx.command('使用科技蓝图 <数量:number>', '使用科技蓝图')
        .action(async ({ session }, 数量 ) => {
            try {
                const { uid, username, 用户资料} = await 玩家检查(ctx, session);

                if ( !数量 || 数量 <= 0 || !Number.isInteger(数量) ) {
                    return `请输入要使用的科技蓝图数量`;
                }

            } catch (error) {
                return (error as Error).message;
            };
        });
}
