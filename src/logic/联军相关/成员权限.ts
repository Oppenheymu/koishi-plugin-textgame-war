import type { CoalitionArmy, CoalitionPermissionLevel } from "@/types";
import { 获取联军权限等级 } from "@/utils/解析用户/联军相关/权限获取";

type 权限列表字段 = Pick<
	CoalitionArmy,
	| "联军四级权限成员列表"
	| "联军一级权限成员列表"
	| "联军二级权限成员列表"
	| "联军三级权限成员列表"
>;

function 去重(列表: string[]): string[] {
	return Array.from(new Set(列表));
}

export function 获取联军成员权限等级(
	联军资料: CoalitionArmy,
	uid: string,
): CoalitionPermissionLevel {
	return 获取联军权限等级(联军资料, uid);
}

export function 获取指定等级成员UID列表(
	联军资料: CoalitionArmy,
	权限等级: CoalitionPermissionLevel,
): string[] {
	const 全部成员 = Object.keys(联军资料.联军成员列表 ?? {});

	if (权限等级 === 4) {
		return 去重([
			联军资料.联军元首,
			联军资料.联军总理,
			...(联军资料.联军四级权限成员列表 ?? []),
		]).filter((uid) => 全部成员.includes(uid));
	}

	return 全部成员.filter(
		(uid) => 获取联军成员权限等级(联军资料, uid) === 权限等级,
	);
}

export function 设置成员权限等级(
	联军资料: CoalitionArmy,
	目标UID: string,
	权限等级: 1 | 2 | 3 | 4,
): 权限列表字段 {
	const 四级 = (联军资料.联军四级权限成员列表 ?? []).filter(
		(uid) => uid !== 目标UID,
	);
	const 一级 = (联军资料.联军一级权限成员列表 ?? []).filter(
		(uid) => uid !== 目标UID,
	);
	const 二级 = (联军资料.联军二级权限成员列表 ?? []).filter(
		(uid) => uid !== 目标UID,
	);
	const 三级 = (联军资料.联军三级权限成员列表 ?? []).filter(
		(uid) => uid !== 目标UID,
	);

	if (权限等级 === 4) {
		四级.push(目标UID);
	} else if (权限等级 === 3) {
		一级.push(目标UID);
	} else if (权限等级 === 2) {
		二级.push(目标UID);
	} else {
		三级.push(目标UID);
	}

	return {
		联军四级权限成员列表: 去重(四级),
		联军一级权限成员列表: 去重(一级),
		联军二级权限成员列表: 去重(二级),
		联军三级权限成员列表: 去重(三级),
	};
}
