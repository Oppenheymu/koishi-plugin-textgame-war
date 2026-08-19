import type { Context } from "koishi";
import { 玩家检查 } from "#ctx/player/domain/守卫";
import { 格式化 } from "#shared/format";

export function 我的钢铁(ctx: Context) {
    ctx.command("我的钢铁").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            return `
【情报查询】
${username}
■ 钢铁：${格式化(用户资料.钢铁)}
■ 铁矿石：${格式化(用户资料.铁矿石 ?? 0)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
