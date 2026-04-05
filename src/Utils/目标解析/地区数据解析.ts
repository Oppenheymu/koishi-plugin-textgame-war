import { Context, Session } from "koishi";
import {
    Region,
    RegionConfig,
    RegionState,
    RegionTerra,
} from "../../types/index";
import { 会话检查, 用户检查 } from "../用户解析";
import { 获取地区展示名称 } from "./地区名称获取";

export type 地区解析结果 = {
    地区编号: string;
    地区资料: Region;
    地区地形资料: RegionTerra;
    地区状态资料: RegionState;
    地区配置资料: RegionConfig;
    展示地区名称: string;
};

export async function 地区解析(
    ctx: Context,
    目标地区编号: string,
): Promise<地区解析结果> {
    const 地区编号 = 目标地区编号?.trim();
    if (!地区编号) {
        throw new Error("请指定地区编号");
    }

    const [地区资料, 地区地形资料, 地区状态资料, 地区配置资料] =
        await Promise.all([
            ctx.database.get("马列地区表", { 地区编号 }).then(([data]) => data),
            ctx.database
                .get("马列地区地形表", { 地区编号 })
                .then(([data]) => data),
            ctx.database
                .get("马列地区状态机", { 地区编号 })
                .then(([data]) => data),
            ctx.database
                .get("马列地区配置表", { 地区编号 })
                .then(([data]) => data),
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

export async function 当前地区解析(
    ctx: Context,
    session: Session | undefined,
): Promise<地区解析结果> {
    会话检查(session);
    const { platform } = 用户检查(session);
    const 群聊ID = session?.guildId?.trim();

    if (!群聊ID) {
        throw new Error("请在群聊中使用该指令");
    }

    const [地区配置] = await ctx.database.get("马列地区配置表", {
        [platform]: 群聊ID,
    });

    if (!地区配置?.地区编号) {
        throw new Error("本群尚未绑定地区，请先发送：绑定地区 地区编号");
    }

    return 地区解析(ctx, 地区配置.地区编号);
}
