import type { Context, Session } from 'koishi';
import { 玩家联军权限设置 } from '@/logic/联军相关/设置权限';
import type {
    CoalitionPermissionAction,
    CoalitionPermissionLevel,
} from '@/types';
import { 玩家检查 } from '../../解析用户/玩家相关/获取数据';
import { 玩家联军检查 } from '../../解析用户/联军相关/玩家检查';
import { 地区解析, type 地区解析结果, 当前地区解析 } from './获取数据';

export type 地区权限检查动作 = Extract<
    CoalitionPermissionAction,
    | '查看地区军事'
    | '查看地区铁路'
    | '查看地区生物实验室'
    | '查看地区核反应堆'
    | '查看地区离心机组'
    | '设置地区驻扎权限'
>;

type 地区查询权限动作 = Exclude<地区权限检查动作, '设置地区驻扎权限'>;

export interface 地区权限检查结果 extends 地区解析结果 {
    username: string;
    联军编号: string;
    权限等级: CoalitionPermissionLevel;
    权限等级需求: CoalitionPermissionLevel;
    是否地区总督: boolean;
    是否地区司令: boolean;
}

export type 地区查询权限结果 = 地区权限检查结果;

async function 地区权限检查(
    ctx: Context,
    session: Session | undefined,
    动作: 地区权限检查动作,
    地区编号参数: string | undefined,
    操作描述: string
): Promise<地区权限检查结果> {
    const { username } = await 玩家检查(ctx, session);

    const 规范地区编号 = 地区编号参数?.trim();
    const 地区结果 = 规范地区编号
        ? await 地区解析(ctx, 规范地区编号, session)
        : await 当前地区解析(ctx, session);

    const 是否地区总督 =
        (地区结果.地区资料.地区总督 ?? '').trim() === username.trim();
    const 是否地区司令 =
        (地区结果.地区战略资料.地区司令 ?? '').trim() === username.trim();

    if (是否地区总督 || 是否地区司令) {
        return {
            ...地区结果,
            username,
            联军编号: '',
            权限等级: 1,
            权限等级需求: 1,
            是否地区总督,
            是否地区司令,
        };
    }

    const 权限等级需求 = await 玩家联军权限设置(ctx, session, 动作);
    const { 联军编号, 权限等级 } = await 玩家联军检查(ctx, session, {
        最低权限等级: 权限等级需求,
        是否必须在成员列表: true,
    });

    const 控制国家 = 地区结果.地区资料.控制国家?.trim();
    if (!控制国家) {
        throw new Error(`该地区暂无控制国家，仅地区总督/司令可${操作描述}`);
    }

    if (联军编号 !== 控制国家) {
        throw new Error(
            `只有地区控制国的有权限成员，或地区总督/司令可${操作描述}`
        );
    }

    return {
        ...地区结果,
        username,
        联军编号,
        权限等级,
        权限等级需求,
        是否地区总督,
        是否地区司令,
    };
}

export async function 地区查询权限检查(
    ctx: Context,
    session: Session | undefined,
    动作: 地区查询权限动作,
    地区编号参数?: string
): Promise<地区查询权限结果> {
    return 地区权限检查(ctx, session, 动作, 地区编号参数, '查看该地区情报');
}

export async function 地区驻扎权限设置检查(
    ctx: Context,
    session: Session | undefined,
    地区编号参数?: string
): Promise<地区权限检查结果> {
    return 地区权限检查(
        ctx,
        session,
        '设置地区驻扎权限',
        地区编号参数,
        '设置驻扎权限'
    );
}

export async function 地区机场权限设置检查(
    ctx: Context,
    session: Session | undefined,
    地区编号参数?: string
): Promise<地区权限检查结果> {
    return 地区权限检查(
        ctx,
        session,
        '设置地区驻扎权限',
        地区编号参数,
        '设置机场权限'
    );
}
