import { Context, Logger } from "koishi";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

import {
    TerrainType,
    CapacityBase,
    CapacityLimit,
    RegionBasicDataItem,
} from "../Types/地区相关";

const logger = new Logger("初始化地区表");

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function 归一化占比(value: number): number {
    if (value <= 0) return 0;
    if (value > 1) return clamp(value / 100, 0, 1); // 兼容百分比数值
    return value; // 已经是 0-1 之间的值直接返回
}

function 判定地区地形(地区: RegionBasicDataItem): TerrainType {
    const {
        MeanElevation: 平均海拔,
        MaxElevation: 最大海拔,
        MinElevation: 最小海拔,
        STDElevation: 地区崎岖度,
    } = 地区;

    if (地区.isOcean) {
        if (平均海拔 <= -3500 || 最小海拔 <= -5000) return TerrainType.超深海;
        if (平均海拔 <= -2500 || 最小海拔 <= -4000) return TerrainType.深海;
        if (平均海拔 <= -1000 || 最小海拔 <= -2500) return TerrainType.中海;
        return TerrainType.浅海;
    }

    if (平均海拔 >= 3200 || 最大海拔 >= 4600) return TerrainType.高山;
    if (平均海拔 >= 2200 || 最大海拔 >= 3600) return TerrainType.中山;
    if (平均海拔 >= 1300 || 最大海拔 >= 2600) return TerrainType.低山;
    if (地区崎岖度 >= 900) return TerrainType.深丘;
    if (地区崎岖度 >= 450) return TerrainType.浅丘;
    if (平均海拔 >= 850) return TerrainType.高原;
    return TerrainType.平原;
}

// 优化：使用映射表替代冗长的 switch-case
const CAPACITY_BASELINE: Partial<Record<TerrainType, CapacityBase>> = {
    [TerrainType.平原]: {
        基础设施: 12_000_000,
        公路: 18_000_000,
        机场: 6_000_000,
        港口: 6_000_000,
        居民区: 20_000_000,
        仓库: 15_000_000,
    },
    [TerrainType.高原]: {
        基础设施: 9_000_000,
        公路: 12_000_000,
        机场: 7_000_000,
        港口: 4_000_000,
        居民区: 12_000_000,
        仓库: 11_000_000,
    },
    [TerrainType.浅丘]: {
        基础设施: 8_000_000,
        公路: 10_000_000,
        机场: 5_000_000,
        港口: 3_000_000,
        居民区: 10_000_000,
        仓库: 9_000_000,
    },
    [TerrainType.深丘]: {
        基础设施: 6_000_000,
        公路: 8_000_000,
        机场: 4_000_000,
        港口: 2_000_000,
        居民区: 8_000_000,
        仓库: 7_000_000,
    },
    [TerrainType.低山]: {
        基础设施: 5_000_000,
        公路: 6_000_000,
        机场: 4_000_000,
        港口: 1_500_000,
        居民区: 6_000_000,
        仓库: 6_000_000,
    },
    [TerrainType.中山]: {
        基础设施: 4_000_000,
        公路: 5_000_000,
        机场: 3_000_000,
        港口: 1_200_000,
        居民区: 5_000_000,
        仓库: 5_000_000,
    },
    [TerrainType.高山]: {
        基础设施: 3_000_000,
        公路: 3_000_000,
        机场: 2_000_000,
        港口: 800_000,
        居民区: 3_000_000,
        仓库: 4_000_000,
    },
};
const DEFAULT_CAPACITY: CapacityBase = {
    基础设施: 0,
    公路: 0,
    机场: 0,
    港口: 0,
    居民区: 0,
    仓库: 0,
};

function 获取容量基线(地形: TerrainType): CapacityBase {
    return CAPACITY_BASELINE[地形] ?? DEFAULT_CAPACITY;
}

function 获取容量上限(
    地区: RegionBasicDataItem,
    地形: TerrainType,
): CapacityLimit {
    if (地区.isOcean) {
        return {
            基础设施上限: 0,
            公路容量上限: 0,
            机场容量上限: 0,
            港口容量上限: 0,
            居民区容量上限: 0,
            仓库容量上限: 0,
        };
    }

    const 基线 = 获取容量基线(地形);
    const 水域占比 = 归一化占比(地区.Water);
    const 草地占比 = 归一化占比(地区.Grassland);
    const 森林占比 = 归一化占比(地区.Forest);
    const 城镇占比 = 归一化占比(地区.Urban);

    const 海拔系数 =
        地区.MeanElevation >= 2500
            ? 0.78
            : 地区.MeanElevation >= 1500
              ? 0.88
              : 地区.MeanElevation >= 800
                ? 0.95
                : 1.05;
    const 崎岖系数 = clamp(1 - 地区.STDElevation / 4500, 0.55, 1.08);
    const 地貌系数 = clamp(
        0.9 + 草地占比 * 0.18 + 森林占比 * 0.08 + 城镇占比 * 0.15,
        0.85,
        1.25,
    );
    const 综合系数 = 海拔系数 * 崎岖系数 * 地貌系数;

    const 港口系数 = 水域占比 <= 0 ? 0 : clamp(0.2 + 水域占比 * 1.2, 0.2, 1.2);

    return {
        基础设施上限: Math.round(基线.基础设施 * 综合系数),
        公路容量上限: Math.round(基线.公路 * 综合系数),
        机场容量上限: Math.round(基线.机场 * 综合系数),
        港口容量上限:
            水域占比 <= 0 ? 0 : Math.round(基线.港口 * 综合系数 * 港口系数),
        居民区容量上限: Math.round(基线.居民区 * 综合系数),
        仓库容量上限: Math.round(基线.仓库 * 综合系数),
    };
}

function 构建进度条(当前: number, 总数: number): string {
    const 长度 = 20;
    const 比例 = 总数 === 0 ? 1 : 当前 / 总数;
    const 已完成 = Math.min(长度, Math.floor(比例 * 长度));
    const 条 = `${"█".repeat(已完成)}${"░".repeat(长度 - 已完成)}`;
    return `[${条}] ${(比例 * 100).toFixed(1)}% (${当前}/${总数})`;
}

async function 读取地区基础数据(): Promise<RegionBasicDataItem[]> {
    const 文件路径 = resolve(
        __dirname,
        "../assets/Region/RegionBasicData.json",
    );
    const 原始内容 = await readFile(文件路径, "utf-8");
    return JSON.parse(原始内容) as RegionBasicDataItem[];
}

async function 写入批次(ctx: Context, 地形批次: any[], 地区批次: any[]) {
    try {
        // 优化：并行执行两个表的 upsert，大幅提升成功时的写入速度
        await Promise.all([
            ctx.database.upsert("马列地区地形表", 地形批次, ["地区编号"]),
            ctx.database.upsert("马列地区表", 地区批次, ["地区编号"]),
            ctx.database.upsert(
                "马列地区状态机",
                [{ 是否已分配: false }],
                ["地区编号"],
            ),
        ]);
        return;
    } catch (error) {
        logger.warn(
            `upsert 批量写入失败，切换兼容单条模式：${(error as Error).message}`,
        );
    }

    // 此处保持顺序遍历，避免并发过高导致 fallback 阶段的连接池爆炸
    for (let i = 0; i < 地区批次.length; i += 1) {
        const 地形记录 = 地形批次[i];
        const 地区记录 = 地区批次[i];
        const 地区编号 = String(地区记录.地区编号);

        try {
            await ctx.database.create("马列地区地形表", 地形记录);
        } catch {
            // 优化：更新时剥离主键字段，防止某些数据库驱动报错
            const { 地区编号: _, ...updateData } = 地形记录;
            await ctx.database.set("马列地区地形表", { 地区编号 }, updateData);
        }

        try {
            await ctx.database.create("马列地区表", 地区记录);
        } catch {
            const { 地区编号: _, ...updateData } = 地区记录;
            await ctx.database.set("马列地区表", { 地区编号 }, updateData);
        }
    }
}

export function 初始化地区表(ctx: Context) {
    ctx.command("初始化地区表", { authority: 3 }).action(
        async ({ session }) => {
            const 发送进度 = async (内容: string) => {
                if (!session) return;
                await session.send(内容);
            };

            try {
                await 发送进度("开始初始化地区表，正在读取地区基础数据...");
                const 地区基础数据 = await 读取地区基础数据();
                const 总数 = 地区基础数据.length;

                logger.info(`初始化地区表开始，总记录数 ${总数}`);
                await 发送进度(
                    `数据读取完成：共 ${总数} 条，开始写入数据库...`,
                );

                const 批次大小 = 500;
                let 已处理 = 0;

                // 优化：在此处进行分批处理和 map 操作，避免在内存中同时生成多个巨大的完整数组
                for (let i = 0; i < 总数; i += 批次大小) {
                    const 基础数据批次 = 地区基础数据.slice(i, i + 批次大小);

                    const 地形批次 = 基础数据批次.map((地区) => ({
                        地区编号: 地区.RegionId,
                        是否为海洋: 地区.isOcean,
                        平均海拔: 地区.MeanElevation,
                        最大海拔: 地区.MaxElevation,
                        最小海拔: 地区.MinElevation,
                        地区崎岖度: 地区.STDElevation,
                        水域: 地区.Water,
                        雪地: 地区.Snow,
                        草地: 地区.Grassland,
                        荒地: 地区.Bareland,
                        森林: 地区.Forest,
                        城镇: 地区.Urban,
                    }));

                    const 地区批次 = 基础数据批次.map((地区) => {
                        const 地区地形 = 判定地区地形(地区);
                        const 容量上限 = 获取容量上限(地区, 地区地形);
                        return {
                            地区编号: 地区.RegionId,
                            地区地形,
                            ...容量上限,
                            地区名称: "",
                            控制国家: "",
                            地区总督: "",
                            地区司令: "",
                            地区驻军: 0,
                            地区堡垒: 0,
                            当前总基础设施: 0,
                            使用的基础设施: 0,
                            当前总公路容量: 0,
                            使用的公路容量: 0,
                            当前总机场容量: 0,
                            使用的机场容量: 0,
                            当前总港口容量: 0,
                            使用的港口容量: 0,
                            当前总居民区容量: 0,
                            使用的居民区容量: 0,
                            当前总仓库容量: 0,
                            使用的仓库容量: 0,
                            炼钢厂数量: 0,
                        };
                    });

                    await 写入批次(ctx, 地形批次, 地区批次);

                    已处理 += 地区批次.length;

                    if (已处理 % (批次大小 * 4) === 0 || 已处理 === 总数) {
                        const 进度 = 构建进度条(已处理, 总数);
                        logger.info(`初始化地区表进度 ${进度}`);
                        await 发送进度(`初始化地区表进度：${进度}`);
                    }
                }

                logger.info(`初始化地区表完成，总处理 ${总数} 条`);
                return `地区表初始化完成：共处理 ${总数} 条地区数据`;
            } catch (error) {
                logger.error(`初始化地区表失败：${(error as Error).message}`);
                return `初始化失败: ${(error as Error).message}`;
            }
        },
    );
}
