import { Context } from "koishi";

export async function 检查名称是否重复(
    ctx: Context,
    名称: string,
    options?: {
        排除玩家ID?: number;
        排除联军编号?: string;
    },
): Promise<"玩家" | "联军" | null> {
    const [重名玩家] = await ctx.database.get("马列玩家配置表", {
        username: 名称,
    });
    if (重名玩家 && 重名玩家.id !== options?.排除玩家ID) {
        return "玩家";
    }

    const [重名联军] = await ctx.database.get("马列联军表", {
        联军名称: 名称,
    });
    if (重名联军 && 重名联军.联军编号 !== options?.排除联军编号) {
        return "联军";
    }

    return null;
}
