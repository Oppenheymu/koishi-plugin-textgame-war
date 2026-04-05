
import { Session, Context } from "koishi";
import {
    CoalitionArmy,
    Player,
    PlayerConfig,
    Region,
    RegionConfig,
    RegionState,
    RegionTerra,
} from "../Types/index";
import { 会话检查 } from "./用户检查";

/**
 * 目标解析函数
 * 支持：@艾特、UID、平台ID
 * 优化数据库查询，减少重复
 */
export async function 目标解析(
    ctx: Context,
    session: Session | undefined,
    目标: string,
): Promise<{
    目标用户ID: number;
    目标用户名: string;
    目标用户资料: Player;
}> {
    会话检查(session);

    // 共用：通过 PlayerConfig 查 Player
    async function 获取目标配置(config: PlayerConfig) {
        const [player] = await ctx.database.get("马列玩家表", {
            id: config.id,
        });
        if (!player)
            throw new Error(
                `数据异常：目标用户配置存在但玩家档案丢失，请联系管理员`,
            );
        return {
            目标用户ID: config.id,
            目标用户名: config.username,
            目标用户资料: player,
        };
    }

    // 1. 优先处理 @艾特
    const atElement = session.elements?.find(
        (el) => el.type === "at" && el.attrs?.["id"],
    );
    if (atElement?.attrs?.["id"]) {
        const 目标用户ID = atElement.attrs["id"];
        const [config] = await ctx.database.get("马列玩家配置表", {
            [session.platform]: 目标用户ID,
        });
        if (!config)
            throw new Error(
                `目标用户尚未注册（${session.platform}:${目标用户ID}），请让对方先发送[注册]指令`,
            );
        return 获取目标配置(config);
    }

    // 2. 处理命令参数 <目标>
    const 输入 = 目标?.trim();
    if (!输入) {
        throw new Error(
            "请指定目标用户：可以 @对方 或 直接输入对方 UID / QQ号",
        );
    }

    // 先查 UID
    let [config] = await ctx.database.get("马列玩家配置表", { uid: 输入 });
    if (config) return 获取目标配置(config);

    // 再查平台ID
    [config] = await ctx.database.get("马列玩家配置表", {
        [session.platform]: 输入,
    });
    if (config) return 获取目标配置(config);

    throw new Error("目标用户尚未注册");
}

export function 获取联军展示名称(
    联军资料: Pick<CoalitionArmy, "联军名称" | "名称是否审核">,
): string {
    return 联军资料.名称是否审核 ? 联军资料.联军名称 : "***";
}

export async function 目标联军解析(
    ctx: Context,
    session: Session | undefined,
    目标: string,
): Promise<{
    目标用户ID: number;
    目标用户名: string;
    目标用户资料: Player;
    联军编号: string;
    联军资料: CoalitionArmy;
    展示联军名称: string;
}> {
    const 目标结果 = await 目标解析(ctx, session, 目标);

    const 联军编号 = 目标结果.目标用户资料.所在联军;
    if (!联军编号) {
        throw new Error(`${目标结果.目标用户名} 同志目前不在任何联军中`);
    }

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) {
        throw new Error(
            "数据异常：已记录所在联军但未找到联军档案，请联系管理员",
        );
    }

    return {
        ...目标结果,
        联军编号,
        联军资料,
        展示联军名称: 获取联军展示名称(联军资料),
    };
}

export async function 联军解析(
    ctx: Context,
    目标联军编号: string,
): Promise<{
    联军编号: string;
    联军资料: CoalitionArmy;
    展示联军名称: string;
}> {
    const 联军编号 = 目标联军编号?.trim();
    if (!联军编号) {
        throw new Error("请指定联军编号，例如：A12345");
    }

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) {
        throw new Error(`未找到联军：${联军编号}`);
    }

    return {
        联军编号,
        联军资料,
        展示联军名称: 获取联军展示名称(联军资料),
    };
}

export function 获取地区展示名称(
    地区配置资料: Pick<RegionConfig, "地区名称" | "名称是否审核">,
): string {
    return 地区配置资料.名称是否审核 ? 地区配置资料.地区名称 : "***";
}

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



