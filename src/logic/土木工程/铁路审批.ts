import dayjs from 'dayjs';
import type { Context } from 'koishi';
import type { PendingRailwayBuild } from '@/types';
import { 地区解析 } from '@/utils';
import { 请求联军审批 } from './联军审批';

export interface 铁路审批自动过期结果 {
    扫描数量: number;
    过期数量: number;
    通知成功: number;
    通知失败: number;
}

function 生成过期通知文本(申请记录: PendingRailwayBuild): string {
    return [
        '【铁路修建申请已自动过期】',
        `申请ID：${申请记录.id}`,
        `发起联军：${申请记录.发起联军名称}（${申请记录.发起联军编号}）`,
        `目标联军：${申请记录.目标联军名称}（${申请记录.目标联军编号}）`,
        `线路：${申请记录.发起地区编号} -> ${申请记录.目标地区编号}`,
        `铁路类型：${申请记录.铁路类型}（${申请记录.铁路类型名称}）`,
        `过期时间：${申请记录.过期时间}`,
        '该申请已超过审批时限，系统已自动标记为 expired。',
    ].join('\n');
}

async function 推送铁路申请过期通知(
    ctx: Context,
    申请记录: PendingRailwayBuild
): Promise<{ 通知成功: number; 通知失败: number }> {
    const 通知文本 = 生成过期通知文本(申请记录);
    const 地区编号列表 = Array.from(
        new Set([申请记录.发起地区编号, 申请记录.目标地区编号])
    );

    let 通知成功 = 0;
    let 通知失败 = 0;

    for (const 地区编号 of 地区编号列表) {
        try {
            const { 地区配置资料 } = await 地区解析(ctx, 地区编号);
            const 推送结果 = await 请求联军审批(ctx, {
                文本内容: 通知文本,
                目标地区配置: {
                    onebot: 地区配置资料.onebot,
                    discord: 地区配置资料.discord,
                    telegram: 地区配置资料.telegram,
                },
            });

            通知成功 += 推送结果.已发送.length;
            通知失败 += 推送结果.发送失败.length;
        } catch {
            通知失败 += 1;
        }
    }

    return {
        通知成功,
        通知失败,
    };
}

export async function 获取有效铁路申请(
    ctx: Context,
    申请ID: string
): Promise<PendingRailwayBuild> {
    const [申请记录] = await ctx.database.get('马列铁路修建申请表', {
        id: 申请ID,
    });

    if (!申请记录) {
        throw new Error(`未找到铁路申请：${申请ID}`);
    }

    if (申请记录.状态 !== 'pending') {
        throw new Error(`该申请已处理，当前状态：${申请记录.状态}`);
    }

    const 当前时间 = dayjs();
    if (申请记录.过期时间 && 当前时间.isAfter(dayjs(申请记录.过期时间))) {
        await ctx.database.set(
            '马列铁路修建申请表',
            { id: 申请记录.id },
            {
                状态: 'expired',
                更新时间: 当前时间.format('YYYY-MM-DD HH:mm'),
                审批备注: '申请已过期（系统自动处理）',
            }
        );

        await 推送铁路申请过期通知(ctx, {
            ...申请记录,
            状态: 'expired',
            更新时间: 当前时间.format('YYYY-MM-DD HH:mm'),
            审批备注: '申请已过期（系统自动处理）',
        });

        throw new Error(`申请已过期：${申请ID}`);
    }

    return 申请记录;
}

export async function 执行铁路审批自动过期处理(
    ctx: Context
): Promise<铁路审批自动过期结果> {
    const 待处理列表 = await ctx.database.get('马列铁路修建申请表', {
        状态: 'pending',
    });

    if (!待处理列表.length) {
        return {
            扫描数量: 0,
            过期数量: 0,
            通知成功: 0,
            通知失败: 0,
        };
    }

    const 当前时间 = dayjs();
    let 过期数量 = 0;
    let 通知成功 = 0;
    let 通知失败 = 0;

    for (const 申请记录 of 待处理列表) {
        if (!申请记录.过期时间 || !当前时间.isAfter(dayjs(申请记录.过期时间))) {
            continue;
        }

        const 更新时间 = 当前时间.format('YYYY-MM-DD HH:mm');

        await ctx.database.set(
            '马列铁路修建申请表',
            { id: 申请记录.id },
            {
                状态: 'expired',
                更新时间,
                审批备注: '申请已过期（系统自动处理）',
            }
        );

        const 推送结果 = await 推送铁路申请过期通知(ctx, {
            ...申请记录,
            状态: 'expired',
            更新时间,
            审批备注: '申请已过期（系统自动处理）',
        });

        过期数量 += 1;
        通知成功 += 推送结果.通知成功;
        通知失败 += 推送结果.通知失败;
    }

    return {
        扫描数量: 待处理列表.length,
        过期数量,
        通知成功,
        通知失败,
    };
}
