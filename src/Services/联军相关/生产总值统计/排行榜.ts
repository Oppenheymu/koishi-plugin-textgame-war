import type { Context } from 'koishi';
import { 尝试发送新闻信号塔通报 } from '@/logic';
import type { CoalitionArmy } from '@/types';
import { 获取联军展示名称 } from '@/utils';
import { 格式化数值 } from '../../utils';
import type { 联军生产总值排行推送结果, 联军生产总值排行项 } from './types';

export function 生成联军生产总值排行榜(联军列表: CoalitionArmy[]): 联军生产总值排行项[] {
    return [...联军列表]
        .sort((a, b) => (b.当天内资本增量 ?? 0) - (a.当天内资本增量 ?? 0))
        .slice(0, 10)
        .map((联军资料, 索引) => ({
            排名: 索引 + 1,
            联军编号: 联军资料.联军编号,
            展示联军名称: 获取联军展示名称(联军资料),
            生产总值: 联军资料.当天内资本增量 ?? 0,
        }));
}

export function 构建排行榜新闻文本(排行榜: 联军生产总值排行项[]): string {
    if (!排行榜.length) {
        return '今日暂无可统计联军数据。';
    }

    return 排行榜
        .map((项) => `${项.排名}. ${项.展示联军名称}（${项.联军编号}）：${格式化数值(项.生产总值)}`)
        .join('\n');
}

export async function 推送联军生产总值排行新闻(
    ctx: Context,
    参数: {
        标题?: string;
        排行榜?: 联军生产总值排行项[];
        联军列表?: CoalitionArmy[];
    } = {}
): Promise<联军生产总值排行推送结果> {
    const 标题 = 参数.标题?.trim() || '全球联军生产总值TOP10';
    const 排行榜 = 参数.排行榜 ?? 生成联军生产总值排行榜(参数.联军列表 ?? []);

    const 新闻结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题,
        内容: 构建排行榜新闻文本(排行榜),
    });

    return {
        标题,
        排行榜,
        新闻已发送数量: 新闻结果?.已发送.length ?? 0,
        新闻发送失败数量: 新闻结果?.发送失败.length ?? 0,
    };
}
