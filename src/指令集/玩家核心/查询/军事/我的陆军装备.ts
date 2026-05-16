import type { Context } from 'koishi';
import type { PlayerWarData } from '../../../../types';
import { 玩家检查 } from '../../../../utils';

export function 我的陆军装备(ctx: Context) {
    ctx.command('我的陆军装备').alias('陆军装备').action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            const 战争数据 = 用户资料 as unknown as PlayerWarData;

            return `
====[我的陆军装备]====
${username} 同志：
■ 步兵装备：${格式化(战争数据.步兵装备)}
■ 卡车：${格式化(战争数据.卡车)}
■ 火炮：${格式化(战争数据.火炮)}
■ 火箭炮：${格式化(战争数据.火箭炮)}
■ 列车炮：${格式化(战争数据.列车炮)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
