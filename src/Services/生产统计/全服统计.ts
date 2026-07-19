import type { Context } from 'koishi';
import { 尝试发送后台信号塔日志, 尝试发送新闻信号塔通报 } from '#/logic';
import { 确保服务记录 } from '#/infrastructure';
import { 服务事件中心, 获取今天日期 } from '../utils';
import type { 全服统计执行结果 } from './types';
import { 构建全服统计新闻内容 } from './新闻构建';

let 正在执行全服统计 = false;

export async function 执行每日全服统计(
    ctx: Context,
    options?: { 忽略日期检查?: boolean }
): Promise<全服统计执行结果> {
    if (正在执行全服统计) {
        return {
            今天: 获取今天日期(),
            是否执行: false,
            原因: '全服统计正在执行中',
            玩家数量: 0,
            平均工资: 0,
            平均科技等级: 0,
            昨日全球生产总值: 0,
            新闻已发送数量: 0,
            新闻发送失败数量: 0,
        };
    }

    正在执行全服统计 = true;
    const logger = ctx.logger('全服数据统计');

    try {
        const 今天 = 获取今天日期();
        const [服务记录] = await ctx.database.get('马列服务表', {
            id: 'service',
        });

        if (!服务记录) {
            await 确保服务记录(ctx, { 上次全服统计日期: 今天 });
        } else if (!options?.忽略日期检查) {
            const 上次统计时间 = 服务记录.上次全服统计日期;
            if (上次统计时间 && 今天 <= 上次统计时间) {
                return {
                    今天,
                    是否执行: false,
                    原因: `今日已统计（上次统计日期：${上次统计时间}）`,
                    玩家数量: 0,
                    平均工资: 0,
                    平均科技等级: 0,
                    昨日全球生产总值: 0,
                    新闻已发送数量: 0,
                    新闻发送失败数量: 0,
                };
            }
        }

        const 玩家列表 = await ctx.database.get('马列玩家表', {});

        if (玩家列表.length === 0) {
            await ctx.database.set('马列服务表', { id: 'service' }, { 上次全服统计日期: 今天 });
            return {
                今天,
                是否执行: true,
                玩家数量: 0,
                平均工资: 0,
                平均科技等级: 0,
                昨日全球生产总值: 0,
                新闻已发送数量: 0,
                新闻发送失败数量: 0,
            };
        }

        let 总工资 = 0;
        let 总科技 = 0;

        for (const 玩家 of 玩家列表) {
            总工资 += 玩家.工人工资;
            总科技 += 玩家.科技等级;
        }

        const 平均工资 = Math.floor(总工资 / 玩家列表.length);
        const 平均科技等级 = Math.floor(总科技 / 玩家列表.length);

        const [全局数据] = await ctx.database.get('马列全球数据表', {
            id: 'global',
        });

        let 昨日全球生产总值 = 0;
        let 历史生产记录: number[] = [];

        if (!全局数据) {
            await ctx.database.create('马列全球数据表', {
                id: 'global',
                全球平均工资: 平均工资,
                全球平均科技等级: 平均科技等级,
                历史生产记录: [],
                今日全球生产总值: 0,
                近三天全球生产总值: 0,
                近七天全球生产总值: 0,
            });
        } else {
            昨日全球生产总值 = 全局数据.今日全球生产总值 || 0;
            历史生产记录 = [...(全局数据.历史生产记录 || []), 昨日全球生产总值];

            if (历史生产记录.length > 7) {
                历史生产记录 = 历史生产记录.slice(-7);
            }

            const 近三天全球生产总值 = 历史生产记录.slice(-3).reduce((a, b) => a + b, 0);
            const 近七天全球生产总值 = 历史生产记录.slice(-7).reduce((a, b) => a + b, 0);

            await ctx.database.set(
                '马列全球数据表',
                { id: 'global' },
                {
                    全球平均工资: 平均工资,
                    全球平均科技等级: 平均科技等级,
                    历史生产记录,
                    近三天全球生产总值,
                    近七天全球生产总值,
                    今日全球生产总值: 0,
                }
            );

            const 新闻结果 = await 尝试发送新闻信号塔通报(ctx, {
                标题: '全服基础数据日报',
                内容: 构建全服统计新闻内容({
                    今天,
                    玩家数量: 玩家列表.length,
                    平均工资,
                    平均科技等级,
                    昨日全球生产总值,
                    近三天全球生产总值,
                    近七天全球生产总值,
                }),
            });

            await ctx.database.set('马列服务表', { id: 'service' }, { 上次全服统计日期: 今天 });

            服务事件中心.emit('生产与统计:全服统计完成', {
                日期: 今天,
                玩家数量: 玩家列表.length,
                昨日全球生产总值,
            });

            logger.info(
                `统计完成：平均工资=${平均工资}，平均科技=${平均科技等级}，昨日产值=${昨日全球生产总值}`
            );

            return {
                今天,
                是否执行: true,
                玩家数量: 玩家列表.length,
                平均工资,
                平均科技等级,
                昨日全球生产总值,
                新闻已发送数量: 新闻结果?.已发送.length ?? 0,
                新闻发送失败数量: 新闻结果?.发送失败.length ?? 0,
            };
        }

        await ctx.database.set('马列服务表', { id: 'service' }, { 上次全服统计日期: 今天 });

        return {
            今天,
            是否执行: true,
            玩家数量: 玩家列表.length,
            平均工资,
            平均科技等级,
            昨日全球生产总值: 0,
            新闻已发送数量: 0,
            新闻发送失败数量: 0,
        };
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : '未知错误';
        await 尝试发送后台信号塔日志(ctx, {
            级别: 'ERROR',
            标题: '全服数据统计异常',
            内容: 错误信息,
        });
        throw error;
    } finally {
        正在执行全服统计 = false;
    }
}
