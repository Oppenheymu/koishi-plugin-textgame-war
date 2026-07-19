import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { type RegionBasicDataItem, TerrainType } from "./types";

export function 构建进度条(当前: number, 总数: number): string {
    const 长度 = 20;
    const 比例 = 总数 === 0 ? 1 : 当前 / 总数;
    const 已完成 = Math.min(长度, Math.floor(比例 * 长度));
    const 条 = `${"█".repeat(已完成)}${"░".repeat(长度 - 已完成)}`;
    return `[${条}] ${(比例 * 100).toFixed(1)}% (${当前}/${总数})`;
}

export async function 读取地区基础数据(): Promise<RegionBasicDataItem[]> {
    const 文件路径 = resolve(
        __dirname,
        "../../../../assets/RegionBasicData.json",
    );
    const 原始内容 = await readFile(文件路径, "utf-8");
    return JSON.parse(原始内容) as RegionBasicDataItem[];
}

export function 判定地区地形(地区: RegionBasicDataItem): TerrainType {
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
