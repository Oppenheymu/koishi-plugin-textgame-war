import { Context } from 'koishi';
import { } from "koishi-plugin-cron";

let 正在执行全服统计 = false;

/**
 * 执行每日全服数据统计
 * 计算全服平均工资、平均科技等级
 * 统计并重置每日生产总值
 */
async function 执行每日统计(ctx: Context): Promise<void> {
    if (正在执行全服统计) return;
    正在执行全服统计 = true;

    try {
        const 现在 = new Date();
        const 今天 = `${现在.getFullYear()}-${String(现在.getMonth() + 1).padStart(2, '0')}-${String(现在.getDate()).padStart(2, '0')}`;

        const 全局状态机 = await ctx.database.get('马列服务表', { id: 'service' });
        const 服务记录 = 全局状态机[0];

        if (!服务记录) {
            await ctx.database.create('马列服务表', {
                id: 'service',
                上次全服统计日期: 今天,
            });
        } else {
            const 上次统计时间 = 服务记录.上次全服统计日期;
            if (上次统计时间 && 今天 <= 上次统计时间) return;
        }

        // 1. 获取所有玩家数据
        const players = await ctx.database.get('马列玩家表', {});

        if (players.length === 0) {
            await ctx.database.set('马列服务表', { id: 'service' }, {
                上次全服统计日期: 今天,
            });
            return;
        }

        // 2. 计算平均值
        let totalWage = 0;
        let totalTech = 0;

        for (const player of players) {
            totalWage += player.工人工资;
            totalTech += player.科技等级;
        }

        const avgWage = totalWage / players.length;
        const avgTech = totalTech / players.length;

        // 3. 处理全服数据
        const globalData = await ctx.database.get('马列全球数据表', { id: 'global' });

        // 如果没有全服数据，初始化
        if (globalData.length === 0) {
            await ctx.database.create('马列全球数据表', {
                id: 'global',
                全球平均工资: avgWage,
                全球平均科技等级: avgTech,
                历史生产记录: [],
                今日全球生产总值: 0,
                近三天全球生产总值: 0,
                近七天全球生产总值: 0,
            });

            await ctx.database.set('马列服务表', { id: 'service' }, {
                上次全服统计日期: 今天,
            });
            return;
        }

        const currentGlobal = globalData[0];
        const todayProduction = currentGlobal?.今日全球生产总值 || 0;
        let history = currentGlobal?.历史生产记录 || [];

        // 将今日数据加入历史记录
        history.push(todayProduction);

        // 只保留最近7天的数据
        if (history.length > 7) {
            history = history.slice(history.length - 7);
        }

        // 计算近三天和近七天总值
        const last3Days = history.slice(-3);
        const sum3Days = last3Days.reduce((a, b) => a + b, 0);

        const last7Days = history.slice(-7);
        const sum7Days = last7Days.reduce((a, b) => a + b, 0);

        // 更新数据库
        await ctx.database.set('马列全球数据表', { id: 'global' }, {
            全球平均工资: avgWage,
            全球平均科技等级: avgTech,
            历史生产记录: history,
            近三天全球生产总值: sum3Days,
            近七天全球生产总值: sum7Days,
            今日全球生产总值: 0,
        });

        await ctx.database.set('马列服务表', { id: 'service' }, {
            上次全服统计日期: 今天,
        });

        console.log(`[全服数据统计] 完成。平均工资: ${avgWage}, 平均科技: ${avgTech}, 昨日产值: ${todayProduction}`);
    } finally {
        正在执行全服统计 = false;
    }
}

/**
 * 启动每日全服数据统计任务
 * 每5分钟检查一次，跨天仅执行一次
 */
export function 每日全服数据统计(ctx: Context) {
    ctx.cron('*/5 * * * *', () => {
        执行每日统计(ctx);
    });
}
