import type { Context } from 'koishi';
import { 确保空间索引就绪 } from './空间索引';
import { 计算真实距离, 计算方向 } from './距离计算';
import { 解析地区编号 } from './坐标解析';

export async function 获取相邻地区(
    ctx: Context,
    地区编号: string,
    最大公里数?: number
): Promise<Array<{ 地区编号: string; 距离: number }>> {
    const 索引 = await 确保空间索引就绪(ctx);

    if (最大公里数 != null) {
        return 索引.获取半径内地区(地区编号, 最大公里数);
    }

    const 直接邻居编号列表 = 索引.获取8方向邻居(地区编号);
    return 直接邻居编号列表.map((编号) => ({
        地区编号: 编号,
        距离: 计算真实距离(地区编号, 编号),
    }));
}

export async function 是否在范围内(
    地区编号A: string,
    地区编号B: string,
    最大公里数: number
): Promise<boolean> {
    const 距离 = 计算真实距离(地区编号A, 地区编号B);
    return 距离 <= 最大公里数;
}

export async function 获取两地关系(
    地区编号A: string,
    地区编号B: string
): Promise<{
    距离: number;
    方向: string;
    坐标A: { gridX: number; gridY: number };
    坐标B: { gridX: number; gridY: number };
}> {
    const 坐标A = 解析地区编号(地区编号A);
    const 坐标B = 解析地区编号(地区编号B);
    return {
        距离: 计算真实距离(地区编号A, 地区编号B),
        方向: 计算方向(坐标A, 坐标B),
        坐标A,
        坐标B,
    };
}
