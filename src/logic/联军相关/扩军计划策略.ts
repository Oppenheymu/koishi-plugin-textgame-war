import { type CoalitionArmy, 联军政体 } from '@/types';

export function 是否豁免扩军计划限制(
    联军资料: CoalitionArmy,
    uid: string,
    权限等级: number
): boolean {
    switch (联军资料.联军政治体制) {
        case 联军政体.极权制:
            return 联军资料.联军元首 === uid;
        case 联军政体.威权制:
            return 权限等级 >= 4;
        case 联军政体.民主制:
            return 权限等级 >= 3;
        default:
            return false;
    }
}
