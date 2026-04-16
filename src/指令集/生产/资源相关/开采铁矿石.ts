import type { Context } from 'koishi';
import { TRandom, 玩家检查 } from '../../../utils';

export function 开采铁矿石(ctx: Context) {
    ctx.command('开采铁矿石').action(async ({ session }) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            if (用户资料.生产次数 <= 0) {
                return '生产次数不足';
            }

            if (用户资料.工人 < 400) {
                return '工人不足，无法开采铁矿石，需要至少400工人';
            }

            if (用户资料.生活资料 < 2000) {
                return '生活资料不足，无法开采铁矿石，需要至少2000生活资料';
            }

            const 增加的铁矿石 = TRandom(6, 10, 30);
            const 原本的铁矿石 = 用户资料.铁矿石;
            const 增加后的铁矿石 = 用户资料.铁矿石 + 增加的铁矿石;

            await ctx.database.set(
                '马列玩家表',
                {
                    id: id,
                },
                {
                    铁矿石: 增加后的铁矿石,
                    生活资料: 用户资料.生活资料 - 2000,
                    生产次数: 用户资料.生产次数 - 1,
                }
            );
            return `
====[征战文游]====
${username} 同志：
■ 铁矿石：${格式化(原本的铁矿石)} → ${格式化(增加后的铁矿石)}
■ 发出工资：2000
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
