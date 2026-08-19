import type { Context } from "koishi";
import { 确保空间索引就绪 } from "#ctx/region/domain/geography/空间索引";

import { 计算真实距离 } from "#ctx/region/domain/geography/距离计算";

export async function 获取相邻地区(
    ctx: Context,
    地区编号: string,
    最大公里数?: number,
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
