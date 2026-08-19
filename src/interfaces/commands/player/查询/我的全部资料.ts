import type { Context } from "koishi";
import { 格式化 } from "#shared/format";
import { 玩家检查 } from "#ctx/player/domain/守卫";

export function 我的全部资料(ctx: Context) {
    ctx.command("我的全部资料").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            return `
=====[征战文游]=====
${username} 同志：
■ 生活资料：${格式化(用户资料.生活资料)}
■ 科技/生产技术：${用户资料.科技等级}/${用户资料.生产技术}
■ 工人/地下/休假：${格式化(用户资料.工人)}/${格式化(用户资料.地下工人)}/${格式化(用户资料.休假工人)}
■ 石油：${格式化(用户资料.石油)}
■ 钢铁：${格式化(用户资料.钢铁)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
