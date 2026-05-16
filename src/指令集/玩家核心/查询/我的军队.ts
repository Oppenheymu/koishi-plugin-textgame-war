import type { Context } from 'koishi';
import type { PlayerWarData } from '../../../types';
import { 玩家检查 } from '../../../utils';

export function 我的军队(ctx: Context) {
    ctx.command('我的军队').action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            const 战争数据 = 用户资料 as unknown as PlayerWarData;

            return `
====[我的军队]====
${username} 同志：

【陆军】
■ 步兵装备：${格式化(战争数据.步兵装备)}
■ 卡车：${格式化(战争数据.卡车)}
■ 火炮：${格式化(战争数据.火炮)}
■ 火箭炮：${格式化(战争数据.火箭炮)}
■ 列车炮：${格式化(战争数据.列车炮)}

【空军】
■ 侦察机：${格式化(战争数据.侦察机)}
■ 战斗机：${格式化(战争数据.战斗机)}（巡航中：${格式化(战争数据.巡航中的战斗机)}）
■ 预警机：${格式化(战争数据.预警机)}（巡航中：${格式化(战争数据.巡航中的预警机)}）
■ 战术轰炸机：${格式化(战争数据.战术轰炸机)}
■ 战略轰炸机：${格式化(战争数据.战略轰炸机)}
■ 隐形轰炸机：${格式化(战争数据.隐形轰炸机)}
■ 大型运输机：${格式化(战争数据.大型运输机)}
■ 小型运输机：${格式化(战争数据.小型运输机)}

【弹药】
■ 火箭弹：${格式化(战争数据.火箭弹)}
■ 防空弹药：${格式化(战争数据.防空弹药)}
■ 轻型航弹：${格式化(战争数据.轻型航弹)}
■ 重型航弹：${格式化(战争数据.重型航弹)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
