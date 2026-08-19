import type { Context } from "koishi";
import { 格式化 } from "#/utils";
import { 玩家检查 } from "../../../utils/index.js";

export function 使用科技蓝图(ctx: Context) {
    ctx.command("使用科技蓝图 <数量:number>").action(async ({ session }, 数量) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            if (!数量 || 数量 <= 0 || !Number.isInteger(数量)) {
                return `请输入要使用的科技蓝图数量`;
            }

            if (数量 > 用户资料.科技蓝图) {
                return `你的科技蓝图不足，当前数量：${用户资料.科技蓝图}`;
            }

            const 新科技蓝图 = 用户资料.科技蓝图 - 数量;
            const 新科技等级 = 用户资料.科技等级 + 数量;

            if (新科技等级 > 3000) {
                return `你最多可以使用${3000 - 用户资料.科技等级}张科技蓝图（达到等级上限）`;
            }

            await ctx.database.set(
                "马列玩家表",
                {
                    id: id,
                },
                {
                    科技蓝图: 新科技蓝图,
                    科技等级: 新科技等级,
                },
            );

            return `
===[征战文游]===
${username} 同志：
成功投入科技生产
■科技级别：${用户资料.科技等级} → ${新科技等级}
■科技蓝图：${格式化(用户资料.科技蓝图)} → ${格式化(新科技蓝图)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
