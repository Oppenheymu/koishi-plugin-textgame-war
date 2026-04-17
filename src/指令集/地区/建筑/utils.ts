import type { Context, Session } from 'koishi';
import type { Player } from '@/types';
import { 更新玩家资料, 玩家检查, 驻扎检查 } from '@/utils';
import type {
    特殊设施类型,
    设施建造对象,
    资源字段,
    资源需求配置,
} from './config';

// ==================== 格式化工具 ====================
export const 格式化 = (n: number) => n.toLocaleString('zh-CN');

// ==================== 轮次处理 ====================
export function 解析轮次(轮次输入: number | undefined): number {
    const 轮次 = Number.isFinite(轮次输入) ? Math.floor(轮次输入 as number) : 1;
    return 轮次 > 0 ? 轮次 : 0;
}

// ==================== 资源计算 ====================
export function 计算资源可执行轮次(
    用户资料: Player,
    资源需求: 资源需求配置
): number {
    let 最大轮次 = Number.MAX_SAFE_INTEGER;

    for (const [字段, 单轮消耗] of Object.entries(资源需求) as [
        资源字段,
        number,
    ][]) {
        if (单轮消耗 <= 0) continue;
        const 当前库存 = 用户资料[字段] as number;
        最大轮次 = Math.min(最大轮次, Math.floor(当前库存 / 单轮消耗));
    }

    return 最大轮次;
}

export function 资源总消耗(资源需求: 资源需求配置, 轮次: number): 资源需求配置 {
    return {
        钢铁: (资源需求.钢铁 ?? 0) * 轮次,
        金属铝: (资源需求.金属铝 ?? 0) * 轮次,
    };
}

// ==================== 设施对象创建 ====================
export function 创建默认设施对象(类型: 特殊设施类型): 设施建造对象 {
    if (类型 === '生物实验室') {
        return {
            是否制备中: false,
            建造进度: 0,
            建造时间: '',
            日志: [],
        };
    }

    return {
        是否运行中: false,
        建造进度: 0,
        建造时间: '',
        日志: [],
    };
}

// ==================== 资源与工资结算 ====================
export async function 执行资源与工资结算(
    ctx: Context,
    玩家ID: number,
    用户资料: Player,
    轮次: number,
    资源需求: 资源需求配置
) {
    const 单轮工资 = 用户资料.工人 * 用户资料.工人工资;
    const 工资消耗 = 单轮工资 * 轮次;
    const 资源消耗 = 资源总消耗(资源需求, 轮次);

    await 更新玩家资料(ctx, 玩家ID, {
        钢铁: 用户资料.钢铁 - (资源消耗.钢铁 ?? 0),
        金属铝: 用户资料.金属铝 - (资源消耗.金属铝 ?? 0),
        生活资料: 用户资料.生活资料 - 工资消耗,
        生产次数: 用户资料.生产次数 - 轮次,
    });

    return {
        工资消耗,
        资源消耗,
    };
}

// ==================== 文本组装 ====================
export function 组装消耗文本(资源消耗: 资源需求配置): string[] {
    const 文本: string[] = [];
    if ((资源消耗.钢铁 ?? 0) > 0) {
        文本.push(`■ 钢铁消耗：${格式化(资源消耗.钢铁 ?? 0)}`);
    }
    if ((资源消耗.金属铝 ?? 0) > 0) {
        文本.push(`■ 金属铝消耗：${格式化(资源消耗.金属铝 ?? 0)}`);
    }
    return 文本;
}

// ==================== 预检查验证 ====================
export async function 执行预检查(
    ctx: Context,
    session: Session | undefined,
    操作名: string
) {
    const { id, username, 当前驻扎地区, 地区编号, 展示地区名称, 地区战略资料 } =
        await 驻扎检查(ctx, session);
    const { 用户资料 } = await 玩家检查(ctx, session);

    if (当前驻扎地区 !== 地区编号) {
        throw new Error(
            `你当前驻扎在 ${当前驻扎地区 || '未驻扎地区'}，仅驻扎在本地区的玩家可${操作名}`
        );
    }

    if (用户资料.生产次数 <= 0) {
        throw new Error('生产次数不足');
    }

    if (用户资料.工人 * 用户资料.生产技术 <= 0) {
        throw new Error('当前生产力为零，无法修建');
    }

    return { id, username, 地区编号, 展示地区名称, 地区战略资料, 用户资料 };
}
