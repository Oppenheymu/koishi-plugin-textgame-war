// 战报推送（详见 军事系统.prompt.md 6.9）
// 推送目标：战斗发生地区绑定群聊（每轮简报）+ 双方联军首都绑定群聊（大战报）
import type { Context } from "koishi";
import { 获取联军展示名称 } from "#ctx/coalition";

const 战报平台列表 = ["onebot", "discord", "telegram"] as const;

/** 批量加载联军展示名称（战报组装用） */
export async function 加载联军名称缓存(
    ctx: Context,
    联军编号列表: string[],
): Promise<Map<string, string>> {
    const 缓存 = new Map<string, string>();
    await Promise.all(
        Array.from(new Set(联军编号列表)).map(async (编号) => {
            const [联军] = await ctx.database.get("马列联军表", {
                联军编号: 编号,
            });
            缓存.set(编号, 联军 ? 获取联军展示名称(联军) : 编号);
        }),
    );
    return 缓存;
}

/**
 * 向指定地区绑定的所有平台群聊推送消息
 * 写法参照 logic/信号塔（逐平台找机器人发送，失败仅告警不阻断）
 */
export async function 向地区绑定群推送(
    ctx: Context,
    地区编号: string,
    文本: string,
): Promise<void> {
    const logger = ctx.logger("战报推送");
    const [地区配置] = await ctx.database.get("马列地区配置表", { 地区编号 });
    if (!地区配置) return;

    await Promise.all(
        战报平台列表.map(async (平台) => {
            const 群聊ID = 地区配置[平台]?.trim();
            if (!群聊ID) return;

            const 平台机器人 = Object.values(ctx.bots).find((bot) => bot.platform === 平台);
            if (!平台机器人) return;

            try {
                await 平台机器人.sendMessage(群聊ID, 文本);
            } catch (error) {
                logger.warn(
                    `战报推送失败：${平台}:${群聊ID}，${error instanceof Error ? error.message : "未知错误"}`,
                );
            }
        }),
    );
}

/** 组织度比例 → 模糊分级（可调：战报显示精确数值 常量控制是否显示精确值） */
export function 组织度分级(比例: number): string {
    if (比例 > 0.7) return "士气高昂";
    if (比例 > 0.4) return "受创";
    if (比例 > 0.1) return "重创";
    return "濒临崩溃";
}

/** HP 比例 → 模糊分级 */
export function HP分级(比例: number): string {
    if (比例 > 0.9) return "轻微损伤";
    if (比例 > 0.6) return "受创";
    if (比例 > 0.3) return "重创";
    return "损失惨重";
}
