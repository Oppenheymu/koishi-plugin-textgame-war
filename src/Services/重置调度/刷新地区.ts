import type { Context } from 'koishi';

export interface 铁路负载重置结果 {
    重置地区数量: number;
    重置铁路数量: number;
}

/**
 * 每小时铁路负载刷新：
 * - 仅查询 `是否有铁路 = true` 的地区战略记录，避免全表扫描
 * - 批量 upsert 写回，将所有铁路 `当前负载` 重置为 0
 */
export async function 执行每小时铁路负载重置(
    ctx: Context
): Promise<铁路负载重置结果> {
    const 有铁路地区列表 = await ctx.database.get('马列地区战略表', {
        是否有铁路: true,
    });

    if (!有铁路地区列表.length) {
        return {
            重置地区数量: 0,
            重置铁路数量: 0,
        };
    }

    let 重置铁路数量 = 0;

    const 更新批次 = 有铁路地区列表.map((地区战略) => {
        const 铁路映射 = { ...(地区战略.铁路 ?? {}) };

        for (const 铁路信息 of Object.values(铁路映射)) {
            if ((铁路信息?.当前负载 ?? 0) > 0) {
                铁路信息.当前负载 = 0;
                重置铁路数量 += 1;
            }
        }

        return {
            地区编号: 地区战略.地区编号,
            铁路: 铁路映射,
            是否有铁路: Object.keys(铁路映射).length > 0,
        };
    });

    if (更新批次.length) {
        await ctx.database.upsert('马列地区战略表', 更新批次, ['地区编号']);
    }

    return {
        重置地区数量: 有铁路地区列表.length,
        重置铁路数量,
    };
}
