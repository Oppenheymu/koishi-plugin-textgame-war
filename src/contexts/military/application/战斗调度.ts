// 军事调度服务（详见 军事系统.prompt.md 第 8 章）
// 每 5 分钟：移动到达轮询 → 战斗结算一轮 → 组织度恢复
import type { Context } from "koishi";
import { 恢复组织度 } from "#ctx/military/domain/battle/恢复组织度";

import { 结算所有战斗 } from "#ctx/military/domain/battle/结算入口";

import { 处理移动到达 } from "#ctx/military/domain/移动到达";

async function 执行军事轮次(ctx: Context): Promise<void> {
    await 处理移动到达(ctx);
    await 结算所有战斗(ctx);
    await 恢复组织度(ctx);
}

export function 军事战斗调度(ctx: Context) {
    ctx.cron("*/5 * * * *", () => {
        执行军事轮次(ctx).catch((error) => {
            ctx.logger("军事调度").error(error);
        });
    });
}
