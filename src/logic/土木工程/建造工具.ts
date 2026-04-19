import { 获取运行时配置 } from '@/config';
import type { TerrainType } from '@/types';

// ==================== 类型定义 ====================

/**
 * 建筑/设施配置接口（通用）
 */
export interface 建筑配置 {
    id: string; // 配置ID
    名称: string; // 显示名称
    科技需求: number;
    基础生产力需求: number;
    资源需求?: Record<string, number>; // 单轮消耗
}

/**
 * 建筑成本计算结果
 */
export interface 建筑成本结果 {
    id: string;
    名称: string;
    基础生产力: number;
    地形惩罚系数: number;
    最终生产力需求: number;
    // 兼容旧命名：部分模块使用 `最终需求生产力`
    最终需求生产力?: number;
    资源需求?: Record<string, number>;
}

// ==================== 地形惩罚系统 ====================

export function 获取地形惩罚系数(地形?: TerrainType): number {
    if (!地形) return 1;

    const 系数映射 = 获取运行时配置().土木工程.地形惩罚系数;
    return 系数映射[地形] ?? 1;
}

// ==================== 通用成本计算 ====================

/**
 * 计算建筑建造成本（支持地形惩罚）
 */
export function 计算建筑成本(参数: {
    配置: 建筑配置;
    地形?: TerrainType;
}): 建筑成本结果 {
    const { 配置, 地形 } = 参数;
    const 地形惩罚系数 = 获取地形惩罚系数(地形);
    const 最终生产力需求 = Math.ceil(配置.基础生产力需求 * 地形惩罚系数);

    const result: 建筑成本结果 = {
        id: 配置.id,
        名称: 配置.名称,
        基础生产力: 配置.基础生产力需求,
        地形惩罚系数,
        最终生产力需求,
        最终需求生产力: 最终生产力需求,
    };

    if (配置.资源需求) {
        result.资源需求 = 配置.资源需求;
    }

    return result;
}

// ==================== 进度计算 ====================

/**
 * 计算建造进度百分比
 */
export function 计算建造进度百分比(
    已投入生产力: number,
    需求生产力: number
): number {
    if (需求生产力 <= 0) return 100;
    if (已投入生产力 <= 0) return 0;

    return Math.max(0, Math.min(100, (已投入生产力 / 需求生产力) * 100));
}

/**
 * 判断是否完工
 */
export function 判断是否完工(当前进度: number, 所需生产力: number): boolean {
    return 当前进度 >= 所需生产力;
}

// ==================== 资源计算 ====================

/**
 * 计算资源可执行轮次
 */
export function 计算资源可执行轮次(
    玩家资源: Record<string, number>,
    资源需求: Record<string, number> | undefined
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
    轮次: number
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
    const {
        请求轮次,
        玩家生产次数,
        单轮工资,
        当前生活资料,
        玩家资源,
        资源需求,
    } = 参数;

    // 工资轮次限制
    const 可负担工资轮次 =
        单轮工资 > 0
            ? Math.floor(当前生活资料 / 单轮工资)
            : Number.MAX_SAFE_INTEGER;

    // 资源轮次限制
    const 可负担资源轮次 = 计算资源可执行轮次(玩家资源, 资源需求);

    // 综合所有限制
    return Math.min(请求轮次, 玩家生产次数, 可负担工资轮次, 可负担资源轮次);
}

// ==================== 铁路专用（向后兼容）====================

export interface 铁路建造成本结果 {
    类型ID: string;
    类型名称: string;
    基础生产力: number;
    地形惩罚系数: number;
    距离惩罚系数: number;
    最终需求生产力: number;
    提供运力: number;
}

export function 获取铁路类型列表() {
    return 获取运行时配置().土木工程.铁路类型列表.map((配置) => ({ ...配置 }));
}

export function 获取铁路类型配置(输入: string) {
    const 规范输入 = 输入.trim();
    const 配置列表 = 获取运行时配置().土木工程.铁路类型列表;

    return (
        配置列表.find((配置) => 配置.类型ID === 规范输入) ??
        配置列表.find((配置) => 配置.类型名称 === 规范输入)
    );
}

export function 计算铁路距离惩罚系数(距离公里数: number): number {
    const { 铁路距离基准公里, 铁路距离惩罚率 } = 获取运行时配置().地理;
    if (距离公里数 <= 0) return 1;
    return 1 + (距离公里数 / 铁路距离基准公里) * 铁路距离惩罚率;
}

export function 计算铁路建造成本(参数: {
    铁路类型输入: string;
    地形?: TerrainType;
    距离公里数?: number;
}): 铁路建造成本结果 {
    const 类型配置 = 获取铁路类型配置(参数.铁路类型输入);

    if (!类型配置) {
        throw new Error('铁路类型不存在，请重新选择');
    }

    const 地形惩罚系数 = 获取地形惩罚系数(参数.地形);
    const 距离惩罚系数 =
        参数.距离公里数 != null ? 计算铁路距离惩罚系数(参数.距离公里数) : 1;
    const 最终需求生产力 = Math.ceil(
        类型配置.需求生产力 * 地形惩罚系数 * 距离惩罚系数
    );

    return {
        类型ID: 类型配置.类型ID,
        类型名称: 类型配置.类型名称,
        基础生产力: 类型配置.需求生产力,
        地形惩罚系数,
        距离惩罚系数,
        最终需求生产力,
        提供运力: 类型配置.提供运力,
    };
}
