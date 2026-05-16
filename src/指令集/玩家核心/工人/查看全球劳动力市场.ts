import type { Context } from 'koishi';
import { 玩家检查 } from '../../../utils/index';

export function 查看全球劳动力市场(ctx: Context) {
    ctx.command('查看全球劳动力市场')
        .alias('全球劳动力市场')
        .alias('劳动力市场')
        .alias('人才市场')
        .action(async ({ session }) => {
            try {
                await 玩家检查(ctx, session);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                const [全球数据] = await ctx.database.get('马列全球数据表', {
                    id: 'service',
                });
                const 全球劳动力 = 全球数据?.全球劳动力市场 ?? 0;

                return `
=====[全球资源]=====
□ 全球劳动力市场:
${格式化(全球劳动力)}
■ 命令示例：招募工人 10
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
