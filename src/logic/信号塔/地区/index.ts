import type { Context } from 'koishi';
import { 尝试发送新闻信号塔通报 } from '../新闻';
import { 构建地区事件内容 } from './构建';
import type { 地区信号塔事件参数, 地区信号塔通报结果 } from './types';

export * from './构建';
export * from './types';
export * from './刷新';

/**
 * 发送地区事件信号塔通报（通用接口）
 */
export async function 发送地区信号塔通报(
    ctx: Context,
    参数: 地区信号塔事件参数
): Promise<地区信号塔通报结果> {
    const { 标题, 内容 } = 构建地区事件内容(参数);

    const 发送结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题,
        前缀: '地区信号塔',
        内容,
    });

    if (!发送结果) {
        throw new Error('地区信号塔推送失败');
    }

    return 发送结果;
}

/**
 * 尝试发送地区事件信号塔通报（异常捕获）
 */
export async function 尝试发送地区信号塔通报(
    ctx: Context,
    参数: 地区信号塔事件参数
): Promise<地区信号塔通报结果 | null> {
    try {
        return await 发送地区信号塔通报(ctx, 参数);
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : '未知错误';
        ctx.logger('信号塔:地区').warn(`地区信号塔流程异常：${错误信息}`);
        return null;
    }
}
