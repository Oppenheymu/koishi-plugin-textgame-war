import {
    Context,
    Session
} from "koishi";
import {
    Region,
    RegionConfig,
    RegionState,
    RegionStrategy,
    RegionTerra,
} from "@/types";
import {
    会话检查
} from "../../解析用户/会话相关/会话检查";
import {
    用户检查
} from "../../解析用户/会话相关/平台检查";
import {
    获取地区展示名称
} from "./获取名称";

export type 地区解析结果 = {
    地区编号: string;
    地区资料: Region;
    地区地形资料: RegionTerra;
    地区状态资料: RegionState;
    地区配置资料: RegionConfig;
    地区战略资料: RegionStrategy;
    展示地区名称: string;
};

export async function 地区解析(
    ctx: Context,
    目标地区编号: string,
    session ? : Session
): Promise < 地区解析结果 > {
    const 输入值 = 目标地区编号?.trim();
    if (!输入值) {
        throw new Error("请指定地区编号");
    }

    let 地区编号 = 输入值;
    let [按编号地区资料] = await ctx.database.get("马列地区表", {
        地区编号: 输入值,
    });

    if (!按编号地区资料 && session) {
        const {
            platform
        } = 用户检查(session);
        const [绑定配置] = await ctx.database.get("马列地区配置表", {
            [platform]: 输入值,
        });
        if (绑定配置?.地区编号) {
            地区编号 = 绑定配置.地区编号;
        }
    }

    const 已知地区资料 = 地区编号 === 输入值 ? 按编号地区资料 : undefined;

    const [地区资料, 地区地形资料, 地区状态资料, 地区配置资料, 地区战略资料] =
    await Promise.all([
        已知地区资料 ?
        Promise.resolve(已知地区资料) :
        ctx.database
        .get("马列地区表", {
            地区编号
        })
        .then(([data]) => data),
        ctx.database
        .get("马列地区地形表", {
            地区编号
        })
        .then(([data]) => data),
        ctx.database
        .get("马列地区状态机", {
            地区编号
        })
        .then(([data]) => data),
        ctx.database
        .get("马列地区配置表", {
            地区编号
        })
        .then(([data]) => data),
        ctx.database
        .get("马列地区战略表", {
            地区编号
        })
        .then(([data]) => data),
    ]);

    if (!地区资料) {
        throw new Error(`未找到地区：${输入值}`);
    }

    if (!地区地形资料 || !地区状态资料 || !地区配置资料 || !地区战略资料) {
        throw new Error(
            `数据异常：地区 ${地区编号} 的地形/状态/配置/战略数据缺失，请联系管理员`
        );
    }

    return {
        地区编号,
        地区资料,
        地区地形资料,
        地区状态资料,
        地区配置资料,
        地区战略资料,
        展示地区名称: 获取地区展示名称(地区配置资料),
    };
}

export async function 更新地区资料(
    ctx: Context,
    地区编号: string,
    更新数据: Partial<Region>
): Promise<void> {
    const [地区资料] = await ctx.database.get("马列地区表", {
        地区编号,
    });

    if (!地区资料) {
        throw new Error(`未找到地区：${地区编号}`);
    }

    const 地区更新: Partial<Region> = {};

    for (const [键, 值] of Object.entries(更新数据 as Record<string, unknown>)) {
        if (键 === "地区编号") continue;

        if (键 in 地区资料) {
            (地区更新 as Record<string, unknown>)[键] = 值;
        }
    }

    if (!Object.keys(地区更新).length) {
        return;
    }

    await ctx.database.set("马列地区表", {
        地区编号,
    }, 地区更新);
}

export async function 当前地区解析(
    ctx: Context,
    session: Session | undefined
): Promise < 地区解析结果 > {
    会话检查(session);
    const {
        platform
    } = 用户检查(session);
    const 群聊ID = session?.guildId?.trim();

    if (!群聊ID) {
        throw new Error("请在群聊中使用该指令");
    }

    const 地区配置列表 = await ctx.database.get("马列地区配置表", {
        [platform]: 群聊ID,
    });

    const 绑定地区编号列表 = Array.from(
        new Set(地区配置列表.map((配置) => 配置.地区编号).filter(Boolean))
    );

    if (!绑定地区编号列表.length) {
        throw new Error("本群尚未绑定地区，请先发送：绑定地区 地区编号");
    }

    if (绑定地区编号列表.length > 1) {
        throw new Error(
            `本群绑定数据异常：检测到多个地区绑定（${绑定地区编号列表.join(
                "、"
            )}），请联系管理员处理`
        );
    }

    return 地区解析(ctx, 绑定地区编号列表[0]);
}
