import type { Context } from "koishi";
import { Logger } from "koishi";
import type { RegionStrategy } from "#ctx/region/domain/types/战略类型";

import type { Region } from "#ctx/region/domain/types/数据类型";

const logger = new Logger("地区数据更新");

export async function 更新地区资料(
    ctx: Context,
    地区编号: string,
    更新数据: Partial<Region>,
): Promise<void> {
    const 地区更新: Record<string, unknown> = {};

    for (const [键, 值] of Object.entries(更新数据 as Record<string, unknown>)) {
        if (键 !== "地区编号") {
            地区更新[键] = 值;
        }
    }

    if (!Object.keys(地区更新).length) {
        return;
    }

    await ctx.database.set(
        "征战地区表",
        { 地区编号 },
        // biome-ignore lint/suspicious/noExplicitAny: 不好做静态类型
        地区更新 as any,
    );
}

export async function 更新地区战略资料(
    ctx: Context,
    地区编号: string,
    更新数据: Partial<RegionStrategy>,
): Promise<void> {
    logger.debug(`[更新开始] 地区: ${地区编号}, 更新数据:`, 更新数据);

    const 战略更新: Record<string, unknown> = {};

    for (const [键, 值] of Object.entries(更新数据 as Record<string, unknown>)) {
        if (键 !== "地区编号") {
            战略更新[键] = 值;
        }
    }

    logger.debug(`[准备更新] 地区: ${地区编号}, 更新字段:`, 战略更新);

    if (!Object.keys(战略更新).length) {
        logger.warn(`[更新跳过] 地区: ${地区编号}, 没有有效的更新字段`);
        return;
    }

    await ctx.database.set(
        "征战地区战略表",
        { 地区编号 },
        // biome-ignore lint/suspicious/noExplicitAny: 不好做静态类型
        战略更新 as any,
    );

    logger.info(`[更新完成] 地区: ${地区编号}, 更新字段数: ${Object.keys(战略更新).length}`);
}
