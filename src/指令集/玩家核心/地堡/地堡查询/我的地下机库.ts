import type { Context } from 'koishi';
import { 玩家检查 } from '../../../../utils';

export function 我的地下机库(ctx: Context) {
    ctx.command('我的地下机库').action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            return `
====[地下机库]====
${username} 同志：
■ 侦察机：${格式化(用户资料.地下侦察机)}
■ 战斗机：${格式化(用户资料.地下战斗机)}
■ 预警机：${格式化(用户资料.地下预警机)}
■ 战术轰：${格式化(用户资料.地下战术轰炸机)}
■ 战略轰：${格式化(用户资料.地下战略轰炸机)}
■ 隐轰：${格式化(用户资料.地下隐形轰炸机)}
■ 大运：${格式化(用户资料.地下大型运输机)}
■ 小运：${格式化(用户资料.地下小型运输机)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
