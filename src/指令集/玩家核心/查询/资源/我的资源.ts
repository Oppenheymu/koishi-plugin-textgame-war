import type { Context } from "koishi";
import { 格式化 } from "#/utils";
import { 玩家检查 } from "../../../../utils/index.js";

export function 我的资源(ctx: Context) {
    ctx.command("我的工人").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            return `
【情报查询】
==公开情报==
${username}
■ 石油：${格式化(用户资料.石油)}
■ 钢铁：${格式化(用户资料.钢铁)}
■ 金属铝：${格式化(用户资料.金属铝)}
■ 铁矿石：${格式化(用户资料.铁矿石)}
■ 铝土矿：${格式化(用户资料.铝土矿)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
