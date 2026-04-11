import { Context } from "koishi";

/**
 * 传入的ID是混淆前的国家ID，别传错
 */
export async function 分配坐标逻辑(ctx: Context, id: number) {
    // 1. 获取当前指针 (使用解构和可选链，逻辑保持简洁)
    const [全局配置] = await ctx.database.get("马列服务表", { id: "GLOBAL" });
    const 当前指针 = 全局配置?.当前地区洗牌指针 ?? 0;

    let 目标编号: string | undefined;

    // --- 第一步：捡漏逻辑 (查找 ID < pointer 且 处于闲置状态的地) ---
    // 【优化】只请求 '地区编号' 字段，大幅度减少从数据库读取的数据量和内存消耗
    const 已遍历池 = await ctx.database.get(
        "马列地区洗牌池",
        { id: { $lt: 当前指针 } },
        ["地区编号"]
    );
    const 已遍历编号 = 已遍历池.map((记录) => 记录.地区编号);

    // 【优化】必须判断数组长度，某些数据库直接传入空数组 $in: [] 会报错
    if (已遍历编号.length > 0) {
        const [回收地] = await ctx.database.get(
            "马列地区状态机",
            {
                地区编号: { $in: 已遍历编号 },
                是否已分配: false,
            },
            { limit: 1 }
        );

        if (回收地) 目标编号 = 回收地.地区编号;
    }

    // --- 第二步：正常发新地 (如果没有捡到漏) ---
    if (!目标编号) {
        const [新地区] = await ctx.database.get("马列地区洗牌池", {
            id: 当前指针,
        });
        if (!新地区) return "所有地区已领完！";

        目标编号 = 新地区.地区编号;

        // 只有发新地才推指针
        await ctx.database.set(
            "马列服务表",
            { id: "GLOBAL" },
            {
                当前地区洗牌指针: 当前指针 + 1,
            }
        );
    }

    // --- 第三步：统一盖章 ---
    // 【优化】无论是捡漏的还是新发的，统一在这里落库，结构更扁平清晰
    await ctx.database.set(
        "马列地区状态机",
        { 地区编号: 目标编号 },
        {
            地区归属国: id,
            是否已分配: true,
        }
    );

    return 目标编号;
}
