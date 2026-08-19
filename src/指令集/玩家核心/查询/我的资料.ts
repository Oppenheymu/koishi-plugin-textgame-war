import type { Context } from "koishi";
import { 格式化 } from "#/utils";
import { 玩家检查 } from "../../../utils/index.js";

export function 我的资料(ctx: Context) {
    ctx.command("我的资料").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            return `
===[征战文游]===
${username} 同志：
■ 生活资料：${格式化(用户资料.生活资料)}
■ 我的工人：${格式化(用户资料.工人)}
■ 科技等级：${用户资料.科技等级}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
