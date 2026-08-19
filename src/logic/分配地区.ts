import type { Context } from "koishi";
import { GRID_HEIGHT, GRID_WIDTH, 栅格坐标转地区编号, 解析地区编号 } from "#/地理集";

const CLUSTER_RADIUS = 5;

async function 查找聚类候选(ctx: Context, 已有地区编号列表: string[]): Promise<string[]> {
    const 候选编号集合 = new Set<string>();

    for (const 编号 of 已有地区编号列表) {
        const { gridX, gridY } = 解析地区编号(编号);

        for (let dx = -CLUSTER_RADIUS; dx <= CLUSTER_RADIUS; dx++) {
            for (let dy = -CLUSTER_RADIUS; dy <= CLUSTER_RADIUS; dy++) {
                if (dx === 0 && dy === 0) continue;

                let nx = gridX + dx;
                const ny = gridY + dy;

                if (ny < 0 || ny >= GRID_HEIGHT) continue;

                if (nx < 0) nx += GRID_WIDTH;
                if (nx >= GRID_WIDTH) nx -= GRID_WIDTH;

                候选编号集合.add(栅格坐标转地区编号({ gridX: nx, gridY: ny }));
            }
        }
    }

    for (const 编号 of 已有地区编号列表) {
        候选编号集合.delete(编号);
    }

    const 候选编号列表 = Array.from(候选编号集合);
    if (候选编号列表.length === 0) return [];

    const 陆地候选 = await ctx.database.get(
        "马列地区地形表",
        {
            地区编号: { $in: 候选编号列表 },
            是否为海洋: false,
        },
        ["地区编号"],
    );

    const 陆地候选编号 = 陆地候选.map((r) => r.地区编号);
    if (陆地候选编号.length === 0) return [];

    const 未分配记录 = await ctx.database.get(
        "马列地区状态机",
        {
            地区编号: { $in: 陆地候选编号 },
            是否已分配: false,
        },
        ["地区编号"],
    );

    return 未分配记录.map((r) => r.地区编号);
}

async function 盖章(ctx: Context, id: number, 联军编号: string, 目标编号: string) {
    await Promise.all([
        ctx.database.set(
            "马列地区状态机",
            { 地区编号: 目标编号 },
            { 地区归属国: id, 是否已分配: true },
        ),
        ctx.database.set("马列地区表", { 地区编号: 目标编号 }, { 控制国家: 联军编号 }),
    ]);
}

export async function 分配坐标逻辑(ctx: Context, id: number, 联军编号: string) {
    const 已有地区列表 = await ctx.database.get("马列地区表", { 控制国家: 联军编号 }, ["地区编号"]);

    if (已有地区列表.length > 0) {
        const 候选列表 = await 查找聚类候选(
            ctx,
            已有地区列表.map((r) => r.地区编号),
        );

        if (候选列表.length > 0) {
            const 目标编号 = 候选列表[Math.floor(Math.random() * 候选列表.length)]!;
            await 盖章(ctx, id, 联军编号, 目标编号);
            return 目标编号;
        }
    }

    const [全局配置] = await ctx.database.get("马列服务表", {
        id: "GLOBAL",
    });
    const 当前指针 = 全局配置?.当前地区洗牌指针 ?? 0;

    let 目标编号: string | undefined;

    const 已遍历池 = await ctx.database.get("马列地区洗牌池", { id: { $lt: 当前指针 } }, [
        "地区编号",
    ]);
    const 已遍历编号 = 已遍历池.map((记录) => 记录.地区编号);

    if (已遍历编号.length > 0) {
        const [回收地] = await ctx.database.get(
            "马列地区状态机",
            {
                地区编号: { $in: 已遍历编号 },
                是否已分配: false,
            },
            { limit: 1 },
        );

        if (回收地) 目标编号 = 回收地.地区编号;
    }

    if (!目标编号) {
        const [新地区] = await ctx.database.get("马列地区洗牌池", {
            id: 当前指针,
        });
        if (!新地区) return "所有地区已领完！";

        目标编号 = 新地区.地区编号;

        await ctx.database.set("马列服务表", { id: "GLOBAL" }, { 当前地区洗牌指针: 当前指针 + 1 });
    }

    await 盖章(ctx, id, 联军编号, 目标编号);
    return 目标编号;
}
