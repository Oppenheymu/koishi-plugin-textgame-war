import type { Context } from "koishi";
import { 格式化 } from "#shared/format";
import type { PlayerWarData } from "#ctx/player/domain/types/战争类型";
import { 玩家检查 } from "#ctx/player/domain/守卫";

export function 我的空军装备(ctx: Context) {
    ctx.command("我的空军装备")
        .alias("空军装备")
        .action(async ({ session }) => {
            try {
                const { username, 用户资料 } = await 玩家检查(ctx, session);

                const 战争数据 = 用户资料 as unknown as PlayerWarData;

                return `
====[我的空军装备]====
${username} 同志：
■ 侦察机：${格式化(战争数据.侦察机)}
■ 战斗机：${格式化(战争数据.战斗机)}（巡航中：${格式化(战争数据.巡航中的战斗机)}）
■ 预警机：${格式化(战争数据.预警机)}（巡航中：${格式化(战争数据.巡航中的预警机)}）
■ 战术轰炸机：${格式化(战争数据.战术轰炸机)}
■ 战略轰炸机：${格式化(战争数据.战略轰炸机)}
■ 隐形轰炸机：${格式化(战争数据.隐形轰炸机)}
■ 大运：${格式化(战争数据.大型运输机)}
■ 小运：${格式化(战争数据.小型运输机)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
