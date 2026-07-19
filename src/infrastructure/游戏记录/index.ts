import type { Context } from 'koishi';
import type { Service } from '#/types';

type 服务记录默认字段 = Partial<
    Pick<
        Service,
        '上次重置签到日期' | '上次全服统计日期' | '上次联军资本统计日期' | '当前地区洗牌指针'
    >
>;

export async function 确保服务记录(ctx: Context, 默认字段: 服务记录默认字段 = {}) {
    await ctx.database.upsert(
        '马列服务表',
        [
            {
                id: 'service',
                ...默认字段,
            },
        ],
        ['id']
    );
}
