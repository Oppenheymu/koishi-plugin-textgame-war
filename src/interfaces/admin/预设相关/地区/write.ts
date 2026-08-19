import { type Context, Logger, type Tables } from "koishi";

const logger = new Logger("初始化地区表");

export async function 写入批次(
    ctx: Context,
    地形批次: Tables["马列地区地形表"][],
    地区批次: Tables["马列地区表"][],
    状态机批次: Tables["马列地区状态机"][],
    配置批次: Tables["马列地区配置表"][],
    战略批次: Tables["马列地区战略表"][],
) {
    try {
        await Promise.all([
            ctx.database.upsert("马列地区地形表", 地形批次, ["地区编号"]),
            ctx.database.upsert("马列地区表", 地区批次, ["地区编号"]),
            ctx.database.upsert("马列地区状态机", 状态机批次, ["地区编号"]),
            ctx.database.upsert("马列地区配置表", 配置批次, ["地区编号"]),
            // biome-ignore lint/suspicious/noExplicitAny: 没静态类型
            ctx.database.upsert("马列地区战略表", 战略批次 as any, ["地区编号"]),
        ]);
        return;
    } catch (error) {
        logger.warn(`upsert 批量写入失败，切换兼容单条模式：${(error as Error).message}`);
    }

    // 此处保持顺序遍历，避免并发过高导致 fallback 阶段的连接池爆炸
    for (let i = 0; i < 地区批次.length; i += 1) {
        // 各批次按索引对齐写入，此处断言非空以保持原有对齐语义
        const 地形记录 = 地形批次[i]!;
        const 地区记录 = 地区批次[i]!;
        const 状态机记录 = 状态机批次[i]!;
        const 配置记录 = 配置批次[i]!;
        const 战略记录 = 战略批次[i]!;
        const 地区编号 = String(地区记录.地区编号);

        try {
            await ctx.database.create("马列地区地形表", 地形记录);
        } catch {
            const { 地区编号: _, ...updateData } = 地形记录;
            await ctx.database.set(
                "马列地区地形表",
                {
                    地区编号,
                },
                updateData,
            );
        }

        try {
            await ctx.database.create("马列地区表", 地区记录);
        } catch {
            const { 地区编号: _, ...updateData } = 地区记录;
            await ctx.database.set(
                "马列地区表",
                {
                    地区编号,
                },
                updateData,
            );
        }

        try {
            await ctx.database.create("马列地区状态机", 状态机记录);
        } catch {
            const { 地区编号: _, ...updateData } = 状态机记录;
            await ctx.database.set(
                "马列地区状态机",
                {
                    地区编号,
                },
                updateData,
            );
        }

        try {
            await ctx.database.create("马列地区配置表", 配置记录);
        } catch {
            const { 地区编号: _, ...updateData } = 配置记录;
            await ctx.database.set(
                "马列地区配置表",
                {
                    地区编号,
                },
                updateData,
            );
        }

        try {
            // biome-ignore lint/suspicious/noExplicitAny: 没静态类型
            await ctx.database.create("马列地区战略表", 战略记录 as any);
        } catch {
            const { 地区编号: _, ...updateData } = 战略记录;
            await ctx.database.set(
                "马列地区战略表",
                {
                    地区编号,
                },
                // biome-ignore lint/suspicious/noExplicitAny: 没静态类型
                updateData as any,
            );
        }
    }
}
