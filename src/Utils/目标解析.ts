import { Session, Context } from "koishi";
import { CoalitionArmy, Player, PlayerConfig } from "../Types/index";
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
