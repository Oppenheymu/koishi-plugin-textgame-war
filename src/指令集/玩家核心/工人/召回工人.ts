import type { Context } from 'koishi';
import { 玩家检查 } from '../../../utils';

export function 召回工人(ctx: Context) {
    ctx.command('召回工人 <数量:number> ')
        .alias('召回')
        .action(async ({ session }, 数量) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                // 输入验证
                if (!数量 || 数量 <= 0 || !Number.isInteger(数量)) {
                    return `请输入要休假的工人数量\n例如：\`工人休假 1000\``;
                }

                if (数量 > 用户资料.休假工人) {
                    return `工人不足！当前休假工人：${格式化(
                        用户资料.休假工人
                    )}，无法召回${格式化(数量)}个工人`;
                }

                if (用户资料.小时是否生产 === false) {
                    return `当前小时内还未生产过，无法召回工人`;
                }

                const 新工人数 = 用户资料.工人 + 数量;
                const 新休假工人数 = 用户资料.休假工人 - 数量;

                await ctx.database.set(
                    '马列玩家表',
                    {
                        id: id,
                    },
                    {
                        工人: 新工人数,
                        休假工人: 新休假工人数,
                    }
                );

                return `
====[工人召回]====
${username} 同志：
□ 休假工人：${格式化(用户资料.休假工人)} → ${格式化(新休假工人数)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
