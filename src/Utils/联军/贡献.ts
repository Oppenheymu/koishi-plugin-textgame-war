import type { CoalitionArmy } from '@/types';

export interface 联军贡献条目 {
    成员UID: string;
    联军贡献: number;
}

export function 获取联军贡献排行数据(联军资料: CoalitionArmy): 联军贡献条目[] {
    return Object.entries(联军资料.联军成员列表 ?? {})
        .map(([成员UID, 成员数据]) => ({
            成员UID,
            联军贡献: 成员数据?.联军贡献 ?? 0,
        }))
        .sort((a, b) => b.联军贡献 - a.联军贡献);
}

export function 获取成员联军贡献(联军资料: CoalitionArmy, uid: string): number {
    return 联军资料.联军成员列表?.[uid]?.联军贡献 ?? 0;
}

export function 获取排除成员后前N贡献总和(
    联军资料: CoalitionArmy,
    排除UID: string,
    数量: number
): number {
    const 排行数据 = 获取联军贡献排行数据(联军资料)
        .filter((成员) => 成员.成员UID !== 排除UID)
        .slice(0, Math.max(0, 数量));

    return 排行数据.reduce((总和, 成员) => 总和 + 成员.联军贡献, 0);
}

export function 获取排除成员后平均贡献(联军资料: CoalitionArmy, 排除UID: string): number {
    const 其他成员 = 获取联军贡献排行数据(联军资料).filter((成员) => 成员.成员UID !== 排除UID);

    if (其他成员.length === 0) {
        return 0;
    }

    const 总贡献 = 其他成员.reduce((总和, 成员) => 总和 + 成员.联军贡献, 0);
    return 总贡献 / 其他成员.length;
}
