import {
    Context,
    Session
} from "koishi";
import type {
    CoalitionPermissionAction,
    CoalitionPermissionLevel
} from "@/types";
import {
    玩家联军检查,
    玩家联军权限设置
} from "@/utils";
import {
    地区解析,
    当前地区解析,
    type 地区解析结果
} from "./获取数据";

type 地区查询权限动作 = Extract<
    CoalitionPermissionAction,
    "查看地区军事" |
    "查看地区铁路" |
    "查看地区生物实验室" |
    "查看地区核反应堆" |
    "查看地区离心机组"
>;

export interface 地区查询权限结果 extends 地区解析结果 {
    username: string;
    联军编号: string;
    权限等级: CoalitionPermissionLevel;
    权限等级需求: CoalitionPermissionLevel;
    是否地区总督: boolean;
    是否地区司令: boolean;
}

export async function 地区查询权限检查(
    ctx: Context,
    session: Session | undefined,
    动作: 地区查询权限动作,
    地区编号参数?: string
): Promise<地区查询权限结果> {
    const 权限等级需求 = await 玩家联军权限设置(ctx, session, 动作);

    const {
        username,
        联军编号,
        权限等级,
    } = await 玩家联军检查(ctx, session, {
        最低权限等级: 1,
        是否必须在成员列表: true,
    });

    const 规范地区编号 = 地区编号参数?.trim();
    const 地区解析结果 = 规范地区编号
        ? await 地区解析(ctx, 规范地区编号)
        : await 当前地区解析(ctx, session);

    const 是否地区总督 =
        (地区解析结果.地区资料.地区总督 ?? "").trim() === username.trim();
    const 是否地区司令 =
        (地区解析结果.地区战略资料.地区司令 ?? "").trim() === username.trim();

    if (!是否地区总督 && !是否地区司令 && 权限等级 < 权限等级需求) {
        throw new Error(
            `权限不足，需要联军${权限等级需求}级及以上权限，或担任该地区总督/司令`
        );
    }

    return {
        ...地区解析结果,
        username,
        联军编号,
        权限等级,
        权限等级需求,
        是否地区总督,
        是否地区司令,
    };
}
