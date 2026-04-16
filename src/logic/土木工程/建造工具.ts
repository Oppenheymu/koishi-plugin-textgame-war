import { 获取运行时配置 } from '@/config';
import type { TerrainType } from '@/types';

export interface 铁路建造成本结果 {
    类型ID: string;
    类型名称: string;
    基础生产力: number;
    地形惩罚系数: number;
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

function 获取地形惩罚系数(地形?: TerrainType): number {
    if (!地形) return 1;

    const 系数映射 = 获取运行时配置().土木工程.地形惩罚系数;
    return 系数映射[地形] ?? 1;
}

export function 计算铁路建造成本(参数: {
    铁路类型输入: string;
    地形?: TerrainType;
}): 铁路建造成本结果 {
    const 类型配置 = 获取铁路类型配置(参数.铁路类型输入);

    if (!类型配置) {
        throw new Error('铁路类型不存在，请重新选择');
    }

    const 地形惩罚系数 = 获取地形惩罚系数(参数.地形);
    const 最终需求生产力 = Math.ceil(类型配置.需求生产力 * 地形惩罚系数);

    return {
        类型ID: 类型配置.类型ID,
        类型名称: 类型配置.类型名称,
        基础生产力: 类型配置.需求生产力,
        地形惩罚系数,
        最终需求生产力,
        提供运力: 类型配置.提供运力,
    };
}

export function 计算建造进度百分比(已投入生产力: number, 需求生产力: number): number {
    if (需求生产力 <= 0) return 100;
    if (已投入生产力 <= 0) return 0;

    return Math.max(0, Math.min(100, (已投入生产力 / 需求生产力) * 100));
}
