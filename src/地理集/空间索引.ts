import type { Context, Tables } from "koishi";
import type { 栅格坐标 } from "./坐标解析";
import { GRID_HEIGHT, GRID_WIDTH, 解析地区编号 } from "./坐标解析";
import { 计算栅格经纬度距离 } from "./距离计算";

type 地区地形记录 = Tables["马列地区地形表"];

const SPATIAL_KEY_SEP = ",";

function 栅格坐标转键(坐标: 栅格坐标): string {
    return `${坐标.gridX}${SPATIAL_KEY_SEP}${坐标.gridY}`;
}

export class 地区空间索引 {
    private 编号到坐标 = new Map<string, 栅格坐标>();
    private 坐标到编号 = new Map<string, string>();
    private 坐标到地形 = new Map<string, 地区地形记录>();
    private 已初始化 = false;

    get size(): number {
        return this.编号到坐标.size;
    }

    get isReady(): boolean {
        return this.已初始化;
    }

    async 初始化(ctx: Context): Promise<void> {
        if (this.已初始化) return;

        const 所有地形 = await ctx.database.get("马列地区地形表", {});

        for (const 地形 of 所有地形) {
            const 坐标 = 解析地区编号(地形.地区编号);
            this.编号到坐标.set(地形.地区编号, 坐标);
            this.坐标到编号.set(栅格坐标转键(坐标), 地形.地区编号);
            this.坐标到地形.set(栅格坐标转键(坐标), 地形);
        }

        this.已初始化 = true;
    }

    获取坐标(地区编号: string): 栅格坐标 | undefined {
        return this.编号到坐标.get(地区编号);
    }

    获取地区编号(坐标: 栅格坐标): string | undefined {
        return this.坐标到编号.get(栅格坐标转键(坐标));
    }

    获取地形(地区编号: string): 地区地形记录 | undefined {
        const 坐标 = this.编号到坐标.get(地区编号);
        if (!坐标) return undefined;
        return this.坐标到地形.get(栅格坐标转键(坐标));
    }

    获取地形By坐标(坐标: 栅格坐标): 地区地形记录 | undefined {
        return this.坐标到地形.get(栅格坐标转键(坐标));
    }

    获取8方向邻居(地区编号: string): string[] {
        const 坐标 = this.编号到坐标.get(地区编号);
        if (!坐标) return [];

        const 结果: string[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = 坐标.gridX + dx;
                const ny = 坐标.gridY + dy;
                if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT) continue;
                const 邻居编号 = this.坐标到编号.get(栅格坐标转键({ gridX: nx, gridY: ny }));
                if (邻居编号) 结果.push(邻居编号);
            }
        }
        return 结果;
    }

    获取半径内地区(
        中心编号: string,
        最大公里数: number,
    ): Array<{ 地区编号: string; 距离: number }> {
        const 中心坐标 = this.编号到坐标.get(中心编号);
        if (!中心坐标) return [];

        const 格子跨度 = Math.ceil(最大公里数 / 50) + 1;
        const 结果: Array<{ 地区编号: string; 距离: number }> = [];

        for (let dx = -格子跨度; dx <= 格子跨度; dx++) {
            for (let dy = -格子跨度; dy <= 格子跨度; dy++) {
                if (dx === 0 && dy === 0) continue;
                let nx = 中心坐标.gridX + dx;
                const ny = 中心坐标.gridY + dy;

                if (ny < 0 || ny >= GRID_HEIGHT) continue;
                if (nx < 0) nx += GRID_WIDTH;
                if (nx >= GRID_WIDTH) nx -= GRID_WIDTH;

                const 目标坐标: 栅格坐标 = { gridX: nx, gridY: ny };
                const 距离 = 计算栅格经纬度距离(中心坐标, 目标坐标);
                if (距离 > 最大公里数) continue;

                const 目标编号 = this.坐标到编号.get(栅格坐标转键(目标坐标));
                if (目标编号) {
                    结果.push({ 地区编号: 目标编号, 距离 });
                }
            }
        }

        结果.sort((a, b) => a.距离 - b.距离);
        return 结果;
    }

    遍历所有坐标(): IterableIterator<[string, 栅格坐标]> {
        return this.编号到坐标.entries();
    }
}

let 全局索引: 地区空间索引 | null = null;

export function 获取空间索引(): 地区空间索引 {
    if (!全局索引) {
        全局索引 = new 地区空间索引();
    }
    return 全局索引;
}

export async function 确保空间索引就绪(ctx: Context): Promise<地区空间索引> {
    const 索引 = 获取空间索引();
    if (!索引.isReady) {
        await 索引.初始化(ctx);
    }
    return 索引;
}
