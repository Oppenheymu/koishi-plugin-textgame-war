import type { Context } from 'koishi';
import { TRandom } from '@/infrastructure';
import { 玩家检查 } from '@/utils';

export function 土法炼钢(ctx: Context) {
    ctx.command('土法炼钢 <数量:number>').action(async ({ session }, 数量) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            if (!数量) {
                return `
=====[工业生产]====
格式：土法炼钢 <数量>
需求: 铁矿石
说明：效率较低但无需科技
`.trim();
            }

            if (数量 <= 0 || !Number.isInteger(数量)) {
                return '请输入有效的数量';
            }

            if (100 <= 数量) return '一次最多可以炼制100钢铁';

            if (用户资料.铁矿石 <= 数量)
                return `铁矿石不足，当前铁矿石${格式化(用户资料.铁矿石)}`;

            if (用户资料.生产次数 <= 0) {
                return '生产次数不足';
            }

            if (用户资料.工人 < 400) {
                return '工人不足，无法开采石油，需要至少400工人';
            }

            if (用户资料.生活资料 < 2000) {
                return '生活资料不足，无法开采石油，需要至少2000生活资料';
            }

            const 原本的钢铁 = 用户资料.钢铁;
            const 原本的铁矿石 = 用户资料.铁矿石;

            const 增加的钢铁 = Math.floor(数量 * TRandom(0.5, 0.6, 0.8, false));
            const 增加后的的钢铁 = 用户资料.钢铁 + 增加的钢铁;
            const 减少后的铁矿石 = 用户资料.铁矿石 - 数量;

            await ctx.database.set(
                '马列玩家表',
                {
                    id: id,
                },
                {
                    钢铁: 增加后的的钢铁,
                    铁矿石: 减少后的铁矿石,
                    生活资料: 用户资料.生活资料 - 2000,
                    生产次数: 用户资料.生产次数 - 1,
                }
            );
            return `
====[征战文游]====
${username} 同志：
■ 钢铁：${格式化(原本的钢铁)} → ${格式化(增加后的的钢铁)}
■ 铁矿：${格式化(原本的铁矿石)} → ${格式化(减少后的铁矿石)}
■ 发出工资：2000
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
