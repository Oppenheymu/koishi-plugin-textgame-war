// 本轮统计（内存跟踪，不入库，详见 军事系统.prompt.md 第 6 章）
import type { 军队面板 } from "#ctx/military/domain/types/军队面板";

import type { Army } from "#ctx/military/domain/types/数据类型";

export interface 军队本轮统计 {
    军队: Army;
    面板: 军队面板;
    本轮组织度损失: number; // 比例
    本轮HP损失: number; // 比例
    本轮造成组织度伤害: number; // 绝对值（经验累积用）
}
