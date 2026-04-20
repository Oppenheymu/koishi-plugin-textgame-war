import dayjs from 'dayjs';
import type { Context } from 'koishi';
import type { PendingRailwayBuild, Railroad, RegionStrategy } from '@/types';
import { 地区解析, 更新玩家资料 } from '@/utils';
import { 计算建造进度百分比 } from './建造工具';

export interface 铁路建造玩家快照 {
    工人: number;
    生产技术: number;
    生产次数: number;
    工人工资: number;
    生活资料: number;
}

export interface 执行铁路修建参数 {
    玩家ID: number;
    用户资料: 铁路建造玩家快照;

    发起地区编号: string;
    目标地区编号: string;

    铁路类型: string;
    最终需求生产力: number;
    提供运力: number;
}

export interface 铁路修建执行结果 {
    实际投入生产力: number;
    当前进度: number;
    是否完工: boolean;
    铁路编号: number;
}

export interface 创建跨联军铁路申请参数 {
    申请人ID: number;
    申请人UID: string;
    申请人名称: string;

    发起联军编号: string;
    发起联军名称: string;
    发起地区编号: string;

    目标联军编号: string;
    目标联军名称: string;
    目标地区编号: string;

    铁路类型: string;
    铁路类型名称: string;
    最终需求生产力: number;
    提供运力: number;
    审批过期小时?: number;
}

export const 世界银行地区编号 = '16080';

function 读取铁路映射(地区战略资料: RegionStrategy): Record<number, Railroad> {
    return { ...(地区战略资料.铁路 ?? {}) };
}

function 计算下一个铁路编号(铁路映射: Record<number, Railroad>): number {
    const 已有编号 = Object.keys(铁路映射)
        .map((key) => Number(key))
        .filter((编号) => Number.isInteger(编号) && 编号 > 0);

    if (!已有编号.length) return 1;
    return Math.max(...已有编号) + 1;
}

function 查找可续建铁路编号(
    铁路映射: Record<number, Railroad>,
    目标地区编号: string,
    铁路类型: string
): number | null {
    const 候选编号 = Object.entries(铁路映射)
        .filter(([, 信息]) => {
            if (信息.目标地区 !== 目标地区编号) return false;
            if (信息.铁路类型 !== 铁路类型) return false;
            return (信息.建造进度 ?? 0) < 100;
        })
        .map(([编号]) => Number(编号))
        .filter((编号) => Number.isInteger(编号) && 编号 > 0);

    if (!候选编号.length) return null;
    return Math.max(...候选编号);
}

async function 持久化地区铁路(
    ctx: Context,
    地区编号: string,
    铁路映射: Record<number, Railroad>
): Promise<void> {
    await ctx.database.set(
        '马列地区战略表',
        { 地区编号 },
        {
            铁路: 铁路映射,
            是否有铁路: Object.keys(铁路映射).length > 0,
        }
    );
}

function oldOrNow(原值?: string): string {
    const 标准值 = 原值?.trim();
    return 标准值 || dayjs().format('YYYY-MM-DD HH:mm');
}

function oldOrEmpty(原值?: string): string {
    return 原值?.trim() ?? '';
}

export function 生成铁路申请ID(): string {
    return `TL${Math.floor(100000 + Math.random() * 900000)}`;
}

async function 生成唯一铁路申请ID(ctx: Context): Promise<string> {
    for (let i = 0; i < 24; i += 1) {
        const 候选ID = 生成铁路申请ID();
        const [已存在] = await ctx.database.get('马列铁路修建申请表', {
            id: 候选ID,
        });
        if (!已存在) {
            return 候选ID;
        }
    }

    throw new Error('生成铁路申请ID失败，请稍后重试');
}

export async function 查询待审核铁路申请(
    ctx: Context,
    发起地区编号: string,
    目标地区编号: string
): Promise<PendingRailwayBuild | null> {
    const 待审核记录 = await ctx.database.get('马列铁路修建申请表', {
        发起地区编号,
        目标地区编号,
        状态: 'pending',
    });

    return 待审核记录[0] ?? null;
}

export async function 创建跨联军铁路申请(
    ctx: Context,
    参数: 创建跨联军铁路申请参数
): Promise<PendingRailwayBuild> {
    const 创建时间 = dayjs();
    const 申请ID = await 生成唯一铁路申请ID(ctx);
    const 审批过期小时 = Math.max(1, 参数.审批过期小时 ?? 24);

    const 申请记录: PendingRailwayBuild = {
        id: 申请ID,
        状态: 'pending',
        申请人ID: 参数.申请人ID,
        申请人UID: 参数.申请人UID,
        申请人名称: 参数.申请人名称,
        发起联军编号: 参数.发起联军编号,
        发起联军名称: 参数.发起联军名称,
        发起地区编号: 参数.发起地区编号,
        目标地区编号: 参数.目标地区编号,
        目标联军编号: 参数.目标联军编号,
        目标联军名称: 参数.目标联军名称,
        铁路类型: 参数.铁路类型,
        铁路类型名称: 参数.铁路类型名称,
        最终需求生产力: 参数.最终需求生产力,
        提供运力: 参数.提供运力,
        已投入生产力: 0,
        创建时间: 创建时间.format('YYYY-MM-DD HH:mm'),
        更新时间: 创建时间.format('YYYY-MM-DD HH:mm'),
        过期时间: 创建时间.add(审批过期小时, 'hour').format('YYYY-MM-DD HH:mm'),

        审批人UID: '',
        审批备注: '',
    };

    await ctx.database.create('马列铁路修建申请表', 申请记录);

    return 申请记录;
}

export async function 执行铁路修建(
    ctx: Context,
    参数: 执行铁路修建参数
): Promise<铁路修建执行结果> {
    const 当前生产力 = 参数.用户资料.工人 * 参数.用户资料.生产技术;
    if (当前生产力 <= 0) {
        throw new Error('当前生产力为 0，无法修建铁路');
    }

    if (参数.用户资料.生产次数 <= 0) {
        throw new Error('生产次数不足，无法继续修建铁路');
    }

    const { 地区战略资料: 发起地区战略资料 } = await 地区解析(ctx, 参数.发起地区编号);
    const 发起地区铁路映射 = 读取铁路映射(发起地区战略资料);

    const 发起地区铁路编号 =
        查找可续建铁路编号(发起地区铁路映射, 参数.目标地区编号, 参数.铁路类型) ??
        计算下一个铁路编号(发起地区铁路映射);

    const 发起地区旧铁路信息 = 发起地区铁路映射[发起地区铁路编号];
    const 已投入生产力 = 发起地区旧铁路信息?.已投入生产力 ?? 0;
    const 建造需求 = 参数.最终需求生产力;

    if (已投入生产力 >= 建造需求) {
        throw new Error('该铁路已完成建造，无需重复修建');
    }

    const 剩余需求 = 建造需求 - 已投入生产力;
    const 实际投入生产力 = Math.min(当前生产力, 剩余需求);

    if (实际投入生产力 <= 0) {
        throw new Error('当前无需新增投入');
    }

    const 所需工人 = Math.ceil(实际投入生产力 / Math.max(1, 参数.用户资料.生产技术));
    const 工资消耗 = 所需工人 * 参数.用户资料.工人工资;

    if (参数.用户资料.生活资料 < 工资消耗) {
        throw new Error(
            `生活资料不足，需 ${工资消耗.toLocaleString('zh-CN')}，当前 ${参数.用户资料.生活资料.toLocaleString('zh-CN')}`
        );
    }

    const 新投入 = 已投入生产力 + 实际投入生产力;
    const 当前进度 = 计算建造进度百分比(新投入, 建造需求);
    const 是否完工 = 当前进度 >= 100;

    const 构建铁路记录 = (来源地区: string, 目标地区: string, 旧铁路信息?: Railroad): Railroad => ({
        目标地区,
        来源地区,
        铁路类型: 参数.铁路类型,
        建造需求,
        已投入生产力: 新投入,
        建造进度: 当前进度,
        铁路状态: 是否完工 ? '正常' : '建设中',
        铁路运力: 参数.提供运力,
        当前负载: 旧铁路信息?.当前负载 ?? 0,
        开通时间: 是否完工 ? oldOrNow(旧铁路信息?.开通时间) : oldOrEmpty(旧铁路信息?.开通时间),
        铁路日志: 旧铁路信息?.铁路日志 ?? [],
    });

    发起地区铁路映射[发起地区铁路编号] = 构建铁路记录(
        参数.发起地区编号,
        参数.目标地区编号,
        发起地区旧铁路信息
    );

    await 持久化地区铁路(ctx, 参数.发起地区编号, 发起地区铁路映射);

    if (参数.目标地区编号 !== 参数.发起地区编号) {
        const { 地区战略资料: 目标地区战略资料 } = await 地区解析(ctx, 参数.目标地区编号);
        const 目标地区铁路映射 = 读取铁路映射(目标地区战略资料);

        const 目标地区铁路编号 =
            查找可续建铁路编号(目标地区铁路映射, 参数.发起地区编号, 参数.铁路类型) ??
            计算下一个铁路编号(目标地区铁路映射);

        const 目标地区旧铁路信息 = 目标地区铁路映射[目标地区铁路编号];

        目标地区铁路映射[目标地区铁路编号] = 构建铁路记录(
            参数.目标地区编号,
            参数.发起地区编号,
            目标地区旧铁路信息
        );

        await 持久化地区铁路(ctx, 参数.目标地区编号, 目标地区铁路映射);
    }

    await 更新玩家资料(ctx, 参数.玩家ID, {
        生活资料: 参数.用户资料.生活资料 - 工资消耗,
        生产次数: 参数.用户资料.生产次数 - 1,
    });

    return {
        实际投入生产力,
        当前进度,
        是否完工,
        铁路编号: 发起地区铁路编号,
    };
}
