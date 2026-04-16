import dayjs from 'dayjs';
import type { Context, Session } from 'koishi';
import { 执行铁路修建, 获取有效铁路申请, 获取联军操作权限 } from '@/logic';
import { 玩家联军检查, 获取玩家完整资料 } from '@/utils';
import { 格式化, 解析铁路申请ID, 读取引用文本 } from './共享';

async function 执行审核铁路(
    ctx: Context,
    session: Session | undefined,
    操作: '同意' | '驳回',
    申请ID文本?: string,
    备注?: string
): Promise<string> {
    const 引用文本 = 读取引用文本(session);
    const 申请ID = 解析铁路申请ID(申请ID文本, 引用文本);

    if (!申请ID) {
        throw new Error('请提供申请ID，或引用申请消息后发送【审核铁路 同意】');
    }

    const 申请记录 = await 获取有效铁路申请(ctx, 申请ID);

    const 最低权限等级 = await 获取联军操作权限(ctx, 申请记录.目标联军编号, '设置地区驻扎权限');
    const { uid, username, 联军编号 } = await 玩家联军检查(ctx, session, {
        最低权限等级,
        是否必须在成员列表: true,
    });

    if (联军编号 !== 申请记录.目标联军编号) {
        throw new Error('仅目标联军成员可审核该铁路申请');
    }

    const 更新时间 = dayjs().format('YYYY-MM-DD HH:mm');

    if (操作 === '驳回') {
        await ctx.database.set(
            '马列铁路修建申请表',
            { id: 申请记录.id },
            {
                状态: 'rejected',
                更新时间,
                审批人UID: uid,
                审批备注: 备注?.trim() || '目标联军已驳回',
            }
        );

        return `已驳回铁路申请 ${申请记录.id}`;
    }

    const 当前用户资料 = await 获取玩家完整资料(ctx, 申请记录.申请人ID);
    const 执行结果 = await 执行铁路修建(ctx, {
        玩家ID: 申请记录.申请人ID,
        用户资料: 当前用户资料,
        发起地区编号: 申请记录.发起地区编号,
        目标地区编号: 申请记录.目标地区编号,
        铁路类型: 申请记录.铁路类型,
        最终需求生产力: 申请记录.最终需求生产力,
        提供运力: 申请记录.提供运力,
    });

    await ctx.database.set(
        '马列铁路修建申请表',
        { id: 申请记录.id },
        {
            状态: 'approved',
            更新时间,
            审批人UID: uid,
            审批备注: 备注?.trim() || '目标联军已同意',
            已投入生产力: 执行结果.实际投入生产力,
        }
    );

    return [
        `铁路申请 ${申请记录.id} 已通过。`,
        `审核人：${username}`,
        `铁路类型：${申请记录.铁路类型}（${申请记录.铁路类型名称}）`,
        `本次投入：${格式化(执行结果.实际投入生产力)} 生产力`,
        `当前进度：${执行结果.当前进度.toFixed(2)}%`,
        执行结果.是否完工 ? '状态：已完工并开通' : '状态：建设中',
        `审批时间：${更新时间}`,
    ].join('\n');
}

export function 审核铁路(ctx: Context) {
    ctx.command('审核铁路 <操作:string> [申请ID:text] [备注:text]').action(
        async ({ session }, 操作, 申请ID, 备注) => {
            try {
                const 规范操作 = 操作?.trim();

                if (['同意', '通过', '批准'].includes(规范操作)) {
                    return await 执行审核铁路(ctx, session, '同意', 申请ID, 备注);
                }

                if (['驳回', '拒绝', '否决'].includes(规范操作)) {
                    return await 执行审核铁路(ctx, session, '驳回', 申请ID, 备注);
                }

                return '操作无效，请使用：审核铁路 同意/驳回 申请ID';
            } catch (error) {
                return (error as Error).message;
            }
        }
    );

    ctx.command('同意铁路 [申请ID:text]').action(async ({ session }, 申请ID) => {
        try {
            return await 执行审核铁路(ctx, session, '同意', 申请ID);
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command('驳回铁路 [申请ID:text] [备注:text]').action(async ({ session }, 申请ID, 备注) => {
        try {
            return await 执行审核铁路(ctx, session, '驳回', 申请ID, 备注);
        } catch (error) {
            return (error as Error).message;
        }
    });
}
