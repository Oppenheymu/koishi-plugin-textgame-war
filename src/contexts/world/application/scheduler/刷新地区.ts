import type { Context } from "koishi";
import { 尝试发送地区刷新信号塔通报 } from "#ctx/beacon";

export interface 地区工业刷新结果 {
    刷新工业地区数量: number;
    刷新炼钢空闲数量: number;
    刷新电解铝空闲数量: number;
}

export interface 每小时地区刷新结果 {
    工业结果: 地区工业刷新结果;
    地区报告已发送数量: number;
    地区报告发送失败数量: number;
}

async function 执行每小时地区工业刷新(ctx: Context): Promise<地区工业刷新结果> {
    const 地区列表 = await ctx.database.get("马列地区表", {});

    if (!地区列表.length) {
        return {
            刷新工业地区数量: 0,
            刷新炼钢空闲数量: 0,
            刷新电解铝空闲数量: 0,
        };
    }

    let 刷新工业地区数量 = 0;
    let 刷新炼钢空闲数量 = 0;
    let 刷新电解铝空闲数量 = 0;

    const 更新批次 = 地区列表
        .map((地区) => {
            const 目标空闲炼钢厂 = 地区.炼钢厂数量 ?? 0;
            const 目标空闲电解铝厂 = 地区.电解铝厂数量 ?? 0;

            const 原空闲炼钢厂 = 地区.空闲的炼钢厂 ?? 0;
            const 原空闲电解铝厂 = 地区.空闲的电解铝厂 ?? 0;

            if (原空闲炼钢厂 === 目标空闲炼钢厂 && 原空闲电解铝厂 === 目标空闲电解铝厂) {
                return null;
            }

            刷新工业地区数量 += 1;
            刷新炼钢空闲数量 += Math.max(0, 目标空闲炼钢厂 - 原空闲炼钢厂);
            刷新电解铝空闲数量 += Math.max(0, 目标空闲电解铝厂 - 原空闲电解铝厂);

            return {
                地区编号: 地区.地区编号,
                空闲的炼钢厂: 目标空闲炼钢厂,
                空闲的电解铝厂: 目标空闲电解铝厂,
            };
        })
        .filter(Boolean) as Array<{
        地区编号: string;
        空闲的炼钢厂: number;
        空闲的电解铝厂: number;
    }>;

    if (更新批次.length) {
        await ctx.database.upsert("马列地区表", 更新批次, ["地区编号"]);
    }

    return {
        刷新工业地区数量,
        刷新炼钢空闲数量,
        刷新电解铝空闲数量,
    };
}

export async function 执行每小时地区刷新(ctx: Context): Promise<每小时地区刷新结果> {
    const [工业结果] = await Promise.all([执行每小时地区工业刷新(ctx)]);

    const 地区报告结果 = await 尝试发送地区刷新信号塔通报(ctx, {
        刷新工业地区数量: 工业结果.刷新工业地区数量,
        刷新炼钢空闲数量: 工业结果.刷新炼钢空闲数量,
        刷新电解铝空闲数量: 工业结果.刷新电解铝空闲数量,
    });

    return {
        工业结果,
        地区报告已发送数量: 地区报告结果?.已发送.length ?? 0,
        地区报告发送失败数量: 地区报告结果?.发送失败.length ?? 0,
    };
}
