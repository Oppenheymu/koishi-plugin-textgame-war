import { Context, Session } from "koishi";
import {
    CoalitionPermission,
    CoalitionPermissionAction,
    CoalitionPermissionLevel,
} from "../../../types";
import { 玩家检查 } from "../玩家相关/获取数据";

export type 联军权限动作 = CoalitionPermissionAction;

export const 联军权限动作列表: 联军权限动作[] = [
    "成员列表",
    "地区列表",
    "贡献排行",
    "邀请加入联军",
    "设置联军权限",
    "移出联军",
    "我的联军权限",
];

export const 默认联军权限配置: Omit<CoalitionPermission, "联军编号"> = {
    成员列表: 1,
    地区列表: 1,
    贡献排行: 1,
    邀请加入联军: 2,
    设置联军权限: 1,
    移出联军: 2,
    我的联军权限: 0,
};

export function 校验联军权限等级(value: number): value is CoalitionPermissionLevel {
    return Number.isInteger(value) && value >= 0 && value <= 3;
}

export function 校验联军权限动作(value: string): value is 联军权限动作 {
    return 联军权限动作列表.includes(value as 联军权限动作);
}

export async function 获取联军权限配置(
    ctx: Context,
    联军编号: string,
): Promise<Omit<CoalitionPermission, "联军编号">> {
    const [数据库配置] = await ctx.database.get("马列联军权限表", { 联军编号 });
    return {
        ...默认联军权限配置,
        ...(数据库配置 ?? {}),
    };
}

export async function 获取联军操作权限(
    ctx: Context,
    联军编号: string,
    动作: 联军权限动作,
): Promise<CoalitionPermissionLevel> {
    const 配置 = await 获取联军权限配置(ctx, 联军编号);
    return 配置[动作] ?? 默认联军权限配置[动作];
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
                ...默认联军权限配置,
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
