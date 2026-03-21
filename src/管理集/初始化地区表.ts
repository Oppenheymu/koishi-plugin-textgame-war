import { Context } from 'koishi';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { TerrainType } from '../Types/地区相关/地区数据类型';

interface RegionBasicDataItem {
  RegionId: string;
  isOcean: boolean;
  MeanElevation: number;
  STDElevation: number;
  MaxElevation: number;
  MinElevation: number;
  Water: number;
  Snow: number;
  Grassland: number;
  Bareland: number;
  Forest: number;
  Urban: number;
}

interface CapacityLimit {
  基础设施上限: number;
  公路容量上限: number;
  机场容量上限: number;
  港口容量上限: number;
  居民区容量上限: number;
  仓库容量上限: number;
}

function 判定地区地形(地区: RegionBasicDataItem): TerrainType {
  const 平均海拔 = 地区.MeanElevation;
  const 最大海拔 = 地区.MaxElevation;
  const 地区崎岖度 = 地区.STDElevation;

  if (地区.isOcean) {
    if (平均海拔 <= -3500) return TerrainType.超深海;
    if (平均海拔 <= -2500) return TerrainType.深海;
    if (平均海拔 <= -1000) return TerrainType.中海;
    return TerrainType.浅海;
  }

  if (平均海拔 >= 3000 || 最大海拔 >= 4500) return TerrainType.高山;
  if (平均海拔 >= 2000 || 最大海拔 >= 3500) return TerrainType.中山;
  if (平均海拔 >= 1200 || 最大海拔 >= 2500) return TerrainType.低山;
  if (地区崎岖度 >= 900) return TerrainType.深丘;
  if (地区崎岖度 >= 450) return TerrainType.浅丘;
  if (平均海拔 >= 800) return TerrainType.高原;
  return TerrainType.平原;
}

function 获取容量上限(地形: TerrainType): CapacityLimit {
  switch (地形) {
    case TerrainType.超深海:
      return { 基础设施上限: 10, 公路容量上限: 0, 机场容量上限: 0, 港口容量上限: 180, 居民区容量上限: 0, 仓库容量上限: 30 };
    case TerrainType.深海:
      return { 基础设施上限: 20, 公路容量上限: 0, 机场容量上限: 0, 港口容量上限: 220, 居民区容量上限: 0, 仓库容量上限: 40 };
    case TerrainType.中海:
      return { 基础设施上限: 30, 公路容量上限: 0, 机场容量上限: 10, 港口容量上限: 260, 居民区容量上限: 20, 仓库容量上限: 60 };
    case TerrainType.浅海:
      return { 基础设施上限: 40, 公路容量上限: 20, 机场容量上限: 20, 港口容量上限: 320, 居民区容量上限: 40, 仓库容量上限: 90 };
    case TerrainType.平原:
      return { 基础设施上限: 320, 公路容量上限: 420, 机场容量上限: 180, 港口容量上限: 80, 居民区容量上限: 500, 仓库容量上限: 450 };
    case TerrainType.高原:
      return { 基础设施上限: 220, 公路容量上限: 240, 机场容量上限: 220, 港口容量上限: 30, 居民区容量上限: 280, 仓库容量上限: 320 };
    case TerrainType.浅丘:
      return { 基础设施上限: 190, 公路容量上限: 210, 机场容量上限: 120, 港口容量上限: 40, 居民区容量上限: 240, 仓库容量上限: 260 };
    case TerrainType.深丘:
      return { 基础设施上限: 150, 公路容量上限: 150, 机场容量上限: 90, 港口容量上限: 30, 居民区容量上限: 180, 仓库容量上限: 220 };
    case TerrainType.低山:
      return { 基础设施上限: 100, 公路容量上限: 90, 机场容量上限: 70, 港口容量上限: 20, 居民区容量上限: 120, 仓库容量上限: 170 };
    case TerrainType.中山:
      return { 基础设施上限: 70, 公路容量上限: 50, 机场容量上限: 50, 港口容量上限: 10, 居民区容量上限: 80, 仓库容量上限: 120 };
    case TerrainType.高山:
      return { 基础设施上限: 40, 公路容量上限: 20, 机场容量上限: 30, 港口容量上限: 0, 居民区容量上限: 50, 仓库容量上限: 80 };
    default:
      return { 基础设施上限: 0, 公路容量上限: 0, 机场容量上限: 0, 港口容量上限: 0, 居民区容量上限: 0, 仓库容量上限: 0 };
  }
}

async function 读取地区基础数据(): Promise<RegionBasicDataItem[]> {
  const 文件路径 = resolve(__dirname, '../assets/Region/RegionBasicData.json');
  const 原始内容 = await readFile(文件路径, 'utf-8');
  const 数据 = JSON.parse(原始内容) as RegionBasicDataItem[];
  return 数据;
}

export function 初始化地区表(ctx: Context) {
  ctx.command('初始化地区表', { authority: 3 })
    .action(async () => {
      try {
        const 地区基础数据 = await 读取地区基础数据();

        for (const 地区 of 地区基础数据) {
          const 地区地形 = 判定地区地形(地区);
          const 容量上限 = 获取容量上限(地区地形);

          const 地区地形记录 = {
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
          };

          const 地区数据记录 = {
            地区编号: 地区.RegionId,
            地区地形,
            ...容量上限,
            地区名称: '',
            控制国家: '',
            地区总督: '',
            地区司令: '',
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

          try {
            await ctx.database.create('马列地区地形表', 地区地形记录);
          } catch {
            await ctx.database.set('马列地区地形表', { 地区编号: 地区.RegionId }, 地区地形记录);
          }

          try {
            await ctx.database.create('马列地区表', 地区数据记录);
          } catch {
            await ctx.database.set('马列地区表', { 地区编号: 地区.RegionId }, 地区数据记录);
          }
        }

        return `地区表初始化完成：共处理 ${地区基础数据.length} 条地区数据`;
      } catch (error) {
        return (error as Error).message;
      }
    });
}
