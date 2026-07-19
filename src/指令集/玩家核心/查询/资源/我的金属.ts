import type { Context } from 'koishi';
import { 玩家检查 } from '#/utils';

export function 我的金属(ctx: Context) {
    ctx.command('我的金属').action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            return `
【情报查询】
${username}
■ 金属铝：${格式化(用户资料.金属铝)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
