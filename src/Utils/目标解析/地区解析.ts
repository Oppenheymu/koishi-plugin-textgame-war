import { Context } from "koishi";
import { Region, RegionConfig, RegionState, RegionTerra } from "../../Types/index";
import { 获取地区展示名称 } from "./获取地区展示名称";

export async function 地区解析(
    ctx: Context,
    目标地区编号: string,
): Promise<{
    地区编号: string;
    地区资料: Region;
    地区地形资料: RegionTerra;
    地区状态资料: RegionState;
    地区配置资料: RegionConfig;
    展示地区名称: string;
}> {
    const 地区编号 = 目标地区编号?.trim();
    if (!地区编号) {
        throw new Error("请指定地区编号");
    }

    const [地区资料, 地区地形资料, 地区状态资料, 地区配置资料] = await Promise.all([
        ctx.database.get("马列地区表", { 地区编号 }).then(([data]) => data),
        ctx.database.get("马列地区地形表", { 地区编号 }).then(([data]) => data),
        ctx.database.get("马列地区状态机", { 地区编号 }).then(([data]) => data),
        ctx.database.get("马列地区配置表", { 地区编号 }).then(([data]) => data),
    ]);

    if (!地区资料) {
        throw new Error(`未找到地区：${地区编号}`);
    }

    if (!地区地形资料 || !地区状态资料 || !地区配置资料) {
        throw new Error(
            `数据异常：地区 ${地区编号} 的地形/状态/配置数据缺失，请联系管理员`,
        );
    }

    return {
        地区编号,
        地区资料,
        地区地形资料,
        地区状态资料,
        地区配置资料,
        展示地区名称: 获取地区展示名称(地区配置资料),
    };
}
