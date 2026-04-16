import type { Context } from 'koishi';

function 计算区间资本增量(历史记录: number[], 当天内资本增量: number) {
    const 近三天 = 历史记录.slice(-2).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;
    const 近七天 = 历史记录.slice(-6).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;

    return {
        近三天,
        近七天,
    };
}

export async function 记录联军资本增量(
    ctx: Context,
    联军编号: string,
    当次资本增量: number,
    本次上缴生活资料 = 0
): Promise<void> {
    const 安全增量 = Math.max(0, 当次资本增量);
    const 安全上缴 = Math.max(0, Math.floor(本次上缴生活资料));

    if (安全增量 <= 0 && 安全上缴 <= 0) return;

    const [联军资料] = await ctx.database.get('马列联军表', { 联军编号 });
    if (!联军资料) return;

    const 当前当天增量 = (联军资料.当天内资本增量 ?? 0) + 安全增量;
    const 历史记录 = 联军资料.资本增量历史记录 ?? [];
    const { 近三天, 近七天 } = 计算区间资本增量(历史记录, 当前当天增量);

    await ctx.database.set(
        '马列联军表',
        { 联军编号 },
        {
            联军生活资料: (联军资料.联军生活资料 ?? 0) + 安全上缴,
            当天内资本增量: 当前当天增量,
            三天内资本增量: 近三天,
            七天内资本增量: 近七天,
        }
    );
}
