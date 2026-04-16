import type {
	CoalitionArmy,
	CoalitionPermission,
	CoalitionPermissionAction,
	CoalitionPermissionLevel,
} from "@/types";
import { 联军政体 } from "@/types";

import { 获取成员联军贡献 } from "@/utils/解析用户/联军相关/贡献统计";
import { 获取联军权限等级 } from "@/utils/解析用户/联军相关/权限获取";

type 联军权限配置 = Omit<CoalitionPermission, "联军编号">;

type 权限列表字段 = Pick<
	CoalitionArmy,
	| "联军四级权限成员列表"
	| "联军一级权限成员列表"
	| "联军二级权限成员列表"
	| "联军三级权限成员列表"
>;

const 政体默认权限配置映射: Record<联军政体, 联军权限配置> = {
	[联军政体.民主制]: {
		成员列表: 2,
		地区列表: 2,
		贡献排行: 2,
		邀请加入联军: 3,
		设置联军权限: 4,
		移出联军: 4,
		我的联军权限: 1,
		查看地区军事: 2,
		查看地区铁路: 2,
		查看地区生物实验室: 2,
		查看地区核反应堆: 3,
		查看地区离心机组: 3,
		设置地区驻扎权限: 2,
		分配生活资料: 3,
		分配历史记录: 1,
		设置税率: 3,
		设置扩军计划: 3,
		转入联军: 1,
		分配军队: 3,
	},
	[联军政体.威权制]: {
		成员列表: 3,
		地区列表: 3,
		贡献排行: 3,
		邀请加入联军: 4,
		设置联军权限: 4,
		移出联军: 4,
		我的联军权限: 1,
		查看地区军事: 3,
		查看地区铁路: 3,
		查看地区生物实验室: 3,
		查看地区核反应堆: 4,
		查看地区离心机组: 4,
		设置地区驻扎权限: 3,
		分配生活资料: 4,
		分配历史记录: 1,
		设置税率: 4,
		设置扩军计划: 4,
		转入联军: 1,
		分配军队: 4,
	},
	[联军政体.极权制]: {
		成员列表: 4,
		地区列表: 4,
		贡献排行: 4,
		邀请加入联军: 4,
		设置联军权限: 4,
		移出联军: 4,
		我的联军权限: 1,
		查看地区军事: 4,
		查看地区铁路: 4,
		查看地区生物实验室: 4,
		查看地区核反应堆: 4,
		查看地区离心机组: 4,
		设置地区驻扎权限: 4,
		分配生活资料: 4,
		分配历史记录: 3,
		设置税率: 4,
		设置扩军计划: 4,
		转入联军: 1,
		分配军队: 4,
	},
};

function 获取非最高权力成员UID列表(
	联军资料: CoalitionArmy,
	元首UID: string,
	总理UID: string,
): string[] {
	return Object.keys(联军资料.联军成员列表 ?? {}).filter(
		(uid) => uid !== 元首UID && uid !== 总理UID,
	);
}

function 去重(列表: string[]): string[] {
	return Array.from(new Set(列表));
}

function 构建权限列表(
	联军资料: CoalitionArmy,
	元首UID: string,
	总理UID: string,
	等级映射: Record<string, CoalitionPermissionLevel>,
	默认等级: CoalitionPermissionLevel,
): 权限列表字段 {
	const 四级: string[] = [];
	const 一级: string[] = [];
	const 二级: string[] = [];
	const 三级: string[] = [];

	const 候选成员列表 = 获取非最高权力成员UID列表(联军资料, 元首UID, 总理UID);

	for (const uid of 候选成员列表) {
		const 等级 = 等级映射[uid] ?? 默认等级;

		if (等级 >= 4) {
			四级.push(uid);
			continue;
		}

		if (等级 === 3) {
			一级.push(uid);
			continue;
		}

		if (等级 === 2) {
			二级.push(uid);
			continue;
		}

		三级.push(uid);
	}

	return {
		联军四级权限成员列表: 去重(四级),
		联军一级权限成员列表: 去重(一级),
		联军二级权限成员列表: 去重(二级),
		联军三级权限成员列表: 去重(三级),
	};
}

export function 获取政体默认权限配置(
	政体: 联军政体,
): Omit<CoalitionPermission, "联军编号"> {
	return {
		...政体默认权限配置映射[政体],
	};
}

export function 获取政体可设置最小权限等级(
	政体: 联军政体,
	动作: CoalitionPermissionAction,
): CoalitionPermissionLevel {
	return 政体默认权限配置映射[政体][动作];
}

export function 极权制降权到一级(
	联军资料: CoalitionArmy,
	设置者UID: string,
): 权限列表字段 {
	const 等级映射: Record<string, CoalitionPermissionLevel> = {};
	const 候选成员列表 = 获取非最高权力成员UID列表(
		联军资料,
		联军资料.联军元首,
		联军资料.联军总理,
	);

	for (const uid of 候选成员列表) {
		if (uid === 设置者UID) {
			const 当前等级 = 获取联军权限等级(联军资料, uid);
			等级映射[uid] =
				当前等级 >= 4 ? 4 : 当前等级 === 3 ? 3 : 当前等级 === 2 ? 2 : 1;
			continue;
		}

		等级映射[uid] = 1;
	}

	return 构建权限列表(
		联军资料,
		联军资料.联军元首,
		联军资料.联军总理,
		等级映射,
		1,
	);
}

export function 政变后权限重置(
	联军资料: CoalitionArmy,
	新元首UID: string,
): 权限列表字段 {
	return 构建权限列表(联军资料, 新元首UID, 新元首UID, {}, 1);
}

export function 按政体动态分配权限(联军资料: CoalitionArmy): 权限列表字段 {
	const 候选成员列表 = 获取非最高权力成员UID列表(
		联军资料,
		联军资料.联军元首,
		联军资料.联军总理,
	);

	const 总贡献 = 候选成员列表.reduce(
		(总和, uid) => 总和 + 获取成员联军贡献(联军资料, uid),
		0,
	);

	const 等级映射: Record<string, CoalitionPermissionLevel> = {};

	for (const uid of 候选成员列表) {
		const 贡献 = 获取成员联军贡献(联军资料, uid);
		const 占比 = 总贡献 > 0 ? 贡献 / 总贡献 : 0;

		if (联军资料.联军政治体制 === 联军政体.民主制) {
			if (占比 >= 0.2) {
				等级映射[uid] = 3;
			} else if (占比 >= 0.08) {
				等级映射[uid] = 2;
			} else {
				等级映射[uid] = 1;
			}
			continue;
		}

		if (联军资料.联军政治体制 === 联军政体.威权制) {
			if (占比 >= 0.35) {
				等级映射[uid] = 3;
			} else if (占比 >= 0.15) {
				等级映射[uid] = 2;
			} else {
				等级映射[uid] = 1;
			}
			continue;
		}

		等级映射[uid] = 1;
	}

	return 构建权限列表(
		联军资料,
		联军资料.联军元首,
		联军资料.联军总理,
		等级映射,
		1,
	);
}
