import type { Context } from 'koishi';
import { 目标联军解析 } from '#/utils';

export function 查看联军名称(ctx: Context) {
    ctx.command('查看联军名称 <目标>', {
        authority: 2,
    }).action(async ({ session }, 目标) => {
        try {
            const { 联军资料 } = await 目标联军解析(ctx, session, 目标);

            return `
联军名称: ${联军资料.联军名称}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
