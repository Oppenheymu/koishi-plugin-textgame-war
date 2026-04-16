import type { CoalitionArmy } from '@/types';
import type { 联军权限等级 } from '../types';

export function 获取联军权限等级(联军资料: CoalitionArmy, uid: string): 联军权限等级 {
    if (联军资料.联军元首 === uid || 联军资料.联军总理 === uid) {
        return 4;
    }

    if ((联军资料.联军四级权限成员列表 ?? []).includes(uid)) {
        return 4;
    }

    if ((联军资料.联军一级权限成员列表 ?? []).includes(uid)) {
        return 3;
    }

    if ((联军资料.联军二级权限成员列表 ?? []).includes(uid)) {
        return 2;
    }

    if ((联军资料.联军三级权限成员列表 ?? []).includes(uid)) {
        return 1;
    }

    return 1;
}
