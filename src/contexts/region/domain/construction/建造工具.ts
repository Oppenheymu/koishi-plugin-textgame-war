// ==================== 资源计算 ====================

/**
 * 计算资源可执行轮次
 */
function 计算资源可执行轮次(
    玩家资源: Record<string, number>,
    资源需求: Record<string, number> | undefined,
): number {
    if (!资源需求) return Number.MAX_SAFE_INTEGER;

    let 最大轮次 = Number.MAX_SAFE_INTEGER;

    for (const [资源类型, 单轮消耗] of Object.entries(资源需求)) {
        if (单轮消耗 <= 0) continue;
        const 当前库存 = 玩家资源[资源类型] ?? 0;
        最大轮次 = Math.min(最大轮次, Math.floor(当前库存 / 单轮消耗));
    }

    return 最大轮次;
}

/**
 * 计算多轮资源总消耗
 */
export function 计算资源总消耗(
    资源需求: Record<string, number> | undefined,
    轮次: number,
): Record<string, number> {
    if (!资源需求 || 轮次 <= 0) return {};

    const 消耗: Record<string, number> = {};
    for (const [资源类型, 单轮消耗] of Object.entries(资源需求)) {
        消耗[资源类型] = 单轮消耗 * 轮次;
    }
    return 消耗;
}

// ==================== 建造轮次计算 ====================

/**
 * 计算最大可执行轮次
 * 综合考虑：生产次数、工资负担、资源库存
 */
export function 计算最大可执行轮次(参数: {
    请求轮次: number;
    玩家生产次数: number;
    单轮工资: number;
    当前生活资料: number;
    玩家资源: Record<string, number>;
    资源需求?: Record<string, number>;
}): number {
    const { 请求轮次, 玩家生产次数, 单轮工资, 当前生活资料, 玩家资源, 资源需求 } = 参数;

    // 工资轮次限制
    const 可负担工资轮次 =
        单轮工资 > 0 ? Math.floor(当前生活资料 / 单轮工资) : Number.MAX_SAFE_INTEGER;

    // 资源轮次限制
    const 可负担资源轮次 = 计算资源可执行轮次(玩家资源, 资源需求);

    // 综合所有限制
    return Math.min(请求轮次, 玩家生产次数, 可负担工资轮次, 可负担资源轮次);
}
