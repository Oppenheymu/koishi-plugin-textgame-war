import type { Context } from 'koishi';
import type { CoalitionArmy } from '#/types';
import { 玩家检查, 目标解析 } from '#/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

type 增量区间 = '当天' | '三天' | '七天';
type 联军增量字段 = Pick<CoalitionArmy, '当天内资本增量' | '三天内资本增量' | '七天内资本增量'>;

function 解析增量区间(输入?: string): 增量区间 {
    const 文本 = 输入?.trim().toLowerCase() ?? '';

    if (['当天', '今日', '今天', '1', '1天', 'day', 'd1'].includes(文本)) {
        return '当天';
    }

    if (['三天', '3', '3天', '三日', '3day', 'd3'].includes(文本)) {
        return '三天';
    }

    if (['七天', '7', '7天', '七日', '7day', 'd7'].includes(文本)) {
        return '七天';
    }

    throw new Error('仅支持：当天 / 三天 / 七天');
}

function 读取资本增量(联军资料: 联军增量字段, 区间: 增量区间): number {
    if (区间 === '当天') return 联军资料.当天内资本增量 ?? 0;
    if (区间 === '三天') return 联军资料.三天内资本增量 ?? 0;
    return 联军资料.七天内资本增量 ?? 0;
}

async function 查询对象联军资本增量(
    ctx: Context,
    // biome-ignore lint/suspicious/noExplicitAny: koishi的问题
    session: any,
    区间: 增量区间,
    目标?: string
): Promise<{ 查询用户名: string; 联军编号: string; 资本增量: number }> {
    const 输入目标 = 目标?.trim();

    let 查询用户名: string;
    let 联军编号: string | null;

    if (输入目标) {
        const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 输入目标);
        查询用户名 = 目标用户名;
        联军编号 = 目标用户资料.所在联军;
    } else {
        const { username, 用户资料 } = await 玩家检查(ctx, session);
        查询用户名 = username;
        联军编号 = 用户资料.所在联军;
    }

    if (!联军编号) {
        throw new Error(`${查询用户名} 同志目前不在任何联军中`);
    }

    const [联军资料] = await ctx.database.get('马列联军表', { 联军编号 });
    if (!联军资料) {
        throw new Error('数据异常：已记录所在联军但未找到联军档案，请联系管理员');
    }

    return {
        查询用户名,
        联军编号,
        资本增量: 读取资本增量(联军资料, 区间),
    };
}

function 构建查询返回文本(查询用户名: string, 联军编号: string, 区间: 增量区间, 数值: number) {
    return `
====[征战文游]====
${查询用户名} 同志：
联军编号：${联军编号}
${区间}资本增量：${格式化(数值)}
`.trim();
}

export function 联军生产总值查询(ctx: Context) {
    ctx.command('查看生产总值 <几天内:string> [目标:string]')
        .alias('生产总值')
        .alias('查看资本增量')
        .alias('资本增量')
        .alias('查看GDP')
        .alias('GDP')
        .action(async ({ session }, 几天内, 目标) => {
            try {
                const 区间 = 解析增量区间(几天内);
                const { 查询用户名, 联军编号, 资本增量 } = await 查询对象联军资本增量(
                    ctx,
                    session,
                    区间,
                    目标
                );

                return 构建查询返回文本(查询用户名, 联军编号, 区间, 资本增量);
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('当天生产总值 [目标:string]')
        .alias('当天资本增量')
        .alias('当天GDP')
        .action(async ({ session }, 目标) => {
            try {
                const { 查询用户名, 联军编号, 资本增量 } = await 查询对象联军资本增量(
                    ctx,
                    session,
                    '当天',
                    目标
                );

                return 构建查询返回文本(查询用户名, 联军编号, '当天', 资本增量);
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('三天生产总值 [目标:string]')
        .alias('三天资本增量')
        .alias('三天GDP')
        .action(async ({ session }, 目标) => {
            try {
                const { 查询用户名, 联军编号, 资本增量 } = await 查询对象联军资本增量(
                    ctx,
                    session,
                    '三天',
                    目标
                );

                return 构建查询返回文本(查询用户名, 联军编号, '三天', 资本增量);
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('七天生产总值 [目标:string]')
        .alias('七天资本增量')
        .alias('七天GDP')
        .action(async ({ session }, 目标) => {
            try {
                const { 查询用户名, 联军编号, 资本增量 } = await 查询对象联军资本增量(
                    ctx,
                    session,
                    '七天',
                    目标
                );

                return 构建查询返回文本(查询用户名, 联军编号, '七天', 资本增量);
            } catch (error) {
                return (error as Error).message;
            }
        });
}
