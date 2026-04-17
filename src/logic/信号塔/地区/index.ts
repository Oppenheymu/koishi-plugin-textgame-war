import type { Context } from 'koishi';
import type { 新闻信号塔发送结果 } from '../新闻';
import { 尝试发送新闻信号塔通报 } from '../新闻';

export interface 地区刷新信号塔参数 {
    重置地区数量: number;
    重置铁路数量: number;
    刷新工业地区数量: number;
    刷新炼钢空闲数量: number;
    刷新电解铝空闲数量: number;
}

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 构建地区刷新信号塔内容(参数: 地区刷新信号塔参数): string {
    return [
        '地区刷新已完成：',
        `■ 铁路负载重置地区：${格式化(参数.重置地区数量)}`,
        `□ 铁路负载重置条目：${格式化(参数.重置铁路数量)}`,
        `■ 工业空闲刷新地区：${格式化(参数.刷新工业地区数量)}`,
        `□ 回收空闲炼钢厂：${格式化(参数.刷新炼钢空闲数量)}`,
        `□ 回收空闲电解铝厂：${格式化(参数.刷新电解铝空闲数量)}`,
    ].join('\n');
}

export async function 发送地区刷新信号塔通报(
    ctx: Context,
    参数: 地区刷新信号塔参数
): Promise<新闻信号塔发送结果> {
    const 内容 = 构建地区刷新信号塔内容(参数);

    const 发送结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题: '每小时地区刷新报告',
        前缀: '地区信号塔',
        内容,
    });

    if (!发送结果) {
        throw new Error('地区信号塔推送失败');
    }

    return 发送结果;
}

export async function 尝试发送地区刷新信号塔通报(
    ctx: Context,
    参数: 地区刷新信号塔参数
): Promise<新闻信号塔发送结果 | null> {
    try {
        return await 发送地区刷新信号塔通报(ctx, 参数);
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : '未知错误';
        ctx.logger('信号塔:地区').warn(`地区信号塔流程异常：${错误信息}`);
        return null;
    }
}
