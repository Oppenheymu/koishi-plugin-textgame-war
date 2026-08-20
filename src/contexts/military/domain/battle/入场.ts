// 入场与统计构建（6.2 入场宽度匹配，详见 军事系统.prompt.md 第 6 章）
import type { 军队面板 } from "#ctx/military/domain/types/军队面板";

import type { Army } from "#ctx/military/domain/types/数据类型";

import { 聚合军队面板 } from "#ctx/military/domain/属性聚合";

import type { 军队本轮统计 } from "./本轮统计.js";

/** 创建带缓存的面板取值器（一场战斗内同一军队只聚合一次） */
export function 创建面板缓存(): (军队: Army) => 军队面板 {
    const 缓存 = new Map<number, 军队面板>();
    return (军队: Army): 军队面板 => {
        let 面板 = 缓存.get(军队.id);
        if (!面板) {
            面板 = 聚合军队面板(军队);
            缓存.set(军队.id, 面板);
        }
        return 面板;
    };
}

/**
 * 入场宽度匹配（6.2：按番号顺序入场，宽度满则后续排队预备队）
 * 首支军队无论多宽都入场（超宽吃 超宽惩罚）
 */
export function 选择入场军队(
    军队列表: Army[],
    战场宽度: number,
    取面板: (军队: Army) => 军队面板,
): { 上场: Army[]; 上场总宽度: number } {
    const 排序 = [...军队列表].sort((a, b) => a.番号 - b.番号);
    const 上场: Army[] = [];
    let 上场总宽度 = 0;
    for (const 军队 of 排序) {
        if (上场.length > 0 && 上场总宽度 >= 战场宽度) break;
        上场.push(军队);
        上场总宽度 += 取面板(军队).宽度;
    }
    return { 上场, 上场总宽度 };
}

/** 为上场军队建立本轮统计（战损/经验记账载体） */
export function 建立统计列表(军队列表: Army[], 取面板: (军队: Army) => 军队面板): 军队本轮统计[] {
    return 军队列表.map((军队) => ({
        军队,
        面板: 取面板(军队),
        本轮组织度损失: 0,
        本轮HP损失: 0,
        本轮造成组织度伤害: 0,
    }));
}
