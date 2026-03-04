import { Context } from 'koishi';
import { } from "koishi-plugin-cron"; 
import { Player } from '../Types/index';



async function 执行生产次数增加(ctx: Context): Promise<void> {

    const 玩家 = await ctx.database.get('malieplayer', {});

    for (const 更新的玩家 of 玩家 ) {

        const 更新: Partial<Player> = { 小时是否生产: false };
        const 旧次数 = 更新的玩家.生产次数 ?? 0

        if ( 旧次数 < 8 ) {
            更新.生产次数 = 旧次数 + 1;
        }

        await ctx.database.set('malieplayer', { userId: 更新的玩家.userId }, 更新);

    }
}



export function 每小时重置生产(ctx: Context) {
  ctx.cron('0 * * * *', () => {
    执行生产次数增加(ctx);
  });
}