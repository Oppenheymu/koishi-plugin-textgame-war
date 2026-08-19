import type { Context, Session } from "koishi";
import { 获取默认联军权限配置 } from "#/config";
import type {
    CoalitionPermission,
    CoalitionPermissionAction,
    CoalitionPermissionLevel,
} from "#/types";
import { 玩家检查 } from "#/utils";

export type 联军权限动作 = CoalitionPermissionAction;

export const 联军权限动作列表: 联军权限动作[] = [
    "成员列表",
    "地区列表",
    "贡献排行",
    "邀请加入联军",
    "设置联军权限",
    "移出联军",
    "我的联军权限",
    "查看地区军事",
    "查看地区生物实验室",
    "查看地区核反应堆",
    "查看地区离心机组",
    "设置地区驻扎权限",
    "分配生活资料",
    "分配历史记录",
    "设置税率",
    "设置扩军计划",
    "转入联军",
    "分配军队",
    "设置地区总督",
    "设置地区司令",
    "部署列车炮",
    "列车炮炮击",
    "授衔",
    "任命指挥官",
];

export const 默认联军权限配置: Omit<CoalitionPermission, "联军编号"> = {
    成员列表: 4,
    地区列表: 4,
    贡献排行: 4,
    邀请加入联军: 3,
    设置联军权限: 4,
    移出联军: 3,
    我的联军权限: 1,
    查看地区军事: 3,
    查看地区生物实验室: 3,
    查看地区核反应堆: 4,
    查看地区离心机组: 4,
    设置地区驻扎权限: 3,
    分配生活资料: 3,
    分配历史记录: 1,
    设置税率: 4,
    设置扩军计划: 4,
    转入联军: 1,
    分配军队: 3,
    设置地区总督: 4,
    设置地区司令: 4,
    部署列车炮: 3,
    列车炮炮击: 3,
    授衔: 4,
    任命指挥官: 3,
};

function 读取默认联军权限配置(): Omit<CoalitionPermission, "联军编号"> {
    return {
        ...默认联军权限配置,
        ...获取默认联军权限配置(),
    };
}

export function 校验联军权限等级(value: number): value is CoalitionPermissionLevel {
    return Number.isInteger(value) && value >= 1 && value <= 4;
}

export function 校验联军权限动作(value: string): value is 联军权限动作 {
    return 联军权限动作列表.includes(value as 联军权限动作);
}

const 旧权限等级映射: Record<0 | 1 | 2 | 3, CoalitionPermissionLevel> = {
    0: 1,
    1: 4,
    2: 3,
    3: 2,
};

function 兼容权限等级(
    value: unknown,
    fallback: CoalitionPermissionLevel,
): CoalitionPermissionLevel {
    if (!Number.isInteger(value)) {
        return fallback;
    }

    const 等级 = value as number;
    if (等级 >= 1 && 等级 <= 4) {
        return 等级 as CoalitionPermissionLevel;
    }

    if (等级 >= 0 && 等级 <= 3) {
        return 旧权限等级映射[等级 as 0 | 1 | 2 | 3];
    }

    return fallback;
}

export async function 获取联军权限配置(
    ctx: Context,
    联军编号: string,
): Promise<Omit<CoalitionPermission, "联军编号">> {
    const [数据库配置] = await ctx.database.get("马列联军权限表", {
        联军编号,
    });
    const 权限配置: Omit<CoalitionPermission, "联军编号"> = 读取默认联军权限配置();

    if (!数据库配置) {
        return 权限配置;
    }

    for (const 动作 of 联军权限动作列表) {
        权限配置[动作] = 兼容权限等级(数据库配置[动作], 权限配置[动作]);
    }

    return 权限配置;
}

export async function 获取联军操作权限(
    ctx: Context,
    联军编号: string,
    动作: 联军权限动作,
): Promise<CoalitionPermissionLevel> {
    const 配置 = await 获取联军权限配置(ctx, 联军编号);
    const 默认配置 = 读取默认联军权限配置();
    return 配置[动作] ?? 默认配置[动作];
}

export async function 设置联军权限配置(
    ctx: Context,
    联军编号: string,
    更新配置: Partial<Omit<CoalitionPermission, "联军编号">>,
): Promise<void> {
    await ctx.database.upsert(
        "马列联军权限表",
        [
            {
                联军编号,
                ...读取默认联军权限配置(),
                ...更新配置,
            },
        ],
        ["联军编号"],
    );
}

export async function 设置联军操作权限(
    ctx: Context,
    联军编号: string,
    动作: 联军权限动作,
    权限等级: CoalitionPermissionLevel,
): Promise<void> {
    await 设置联军权限配置(ctx, 联军编号, {
        [动作]: 权限等级,
    } as Partial<Omit<CoalitionPermission, "联军编号">>);
}

export async function 玩家联军权限设置(
    ctx: Context,
    session: Session | undefined,
    动作: 联军权限动作,
): Promise<CoalitionPermissionLevel> {
    const { 用户资料 } = await 玩家检查(ctx, session);
    const 联军编号 = 用户资料.所在联军;
    if (!联军编号) {
        throw new Error("玩家不在联军中");
    }
    return 获取联军操作权限(ctx, 联军编号, 动作);
}
