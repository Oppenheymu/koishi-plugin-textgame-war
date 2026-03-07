
import { Context } from 'koishi';
import { TRandom, 玩家检查 } from '../../Utils';



export  function 开采铝土矿(ctx: Context) {
    ctx.command('开采铝土矿')
        .action(async ({ session }) => {
            try {
                const {  id , username , 用户资料 } = await 玩家检查(ctx, session);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                if ( 用户资料.生产次数 <= 0) {
                    return '生产次数不足';
                }


                if ( 用户资料.工人 < 400 ) {
                    return '工人不足，无法开采铝土矿，需要至少400工人';
                }

                if ( 用户资料.生活资料 < 2000 ) {
                    return '生活资料不足，无法开采铝土矿，需要至少2000生活资料';
                }

                const 增加的铝土矿 = TRandom(100, 300, 500);
                const 原本的铝土矿 = 用户资料.铝土矿;
                const 增加后的铝土矿 = 用户资料.铝土矿 + 增加的铝土矿;

                await ctx.database.set('malieplayer', { id: id }, {
                    铝土矿: 增加后的铝土矿,
                    生活资料: 用户资料.生活资料 - 2000
                });
                return `
====[征战文游]====
${username} 同志：
■ 铝土矿：${格式化(原本的铝土矿)} → ${格式化(增加后的铝土矿)}
■ 发出工资：2000
`.trim();

            } catch (error) {
                return (error as Error).message;
            }
        });
}
