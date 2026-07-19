import type { Context } from 'koishi';
import { 玩家检查 } from '#/utils';

export function 我的铀(ctx: Context) {
    ctx.command('我的铀').action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            return `
【情报查询】
${username}
■ 铀矿：${格式化(用户资料.铀矿)}
■ 浓缩铀：${格式化(用户资料.浓缩铀)}
■ 钚：${格式化(用户资料.钚)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
