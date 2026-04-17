import type { Context, Session } from 'koishi';
import type { Player, PlayerWarData } from '@/types';
import { 发送并抛出错误 } from '../error';
import type { 玩家解析结果 } from '../types';
import { 会话检查 } from '../会话相关/会话检查';
import { 用户检查 } from '../会话相关/平台检查';
import { 获取玩家展示名称 } from './获取名称';

export type 玩家完整资料 = Player & PlayerWarData;

function 合并玩家资料(
    玩家档案记录: Player,
    玩家战争记录: PlayerWarData
): 玩家完整资料 {
    return {
        ...玩家档案记录,
        ...玩家战争记录,
    };
}

function 抛出数据异常(
    session: Session | undefined,
    提示消息: string,
    错误消息: string
): never {
    if (session) {
        return 发送并抛出错误(session, 提示消息, 错误消息);
    }
    throw new Error(提示消息);
}

export async function 获取玩家完整资料(
    ctx: Context,
    id: number
): Promise<玩家完整资料> {
    const [[玩家档案记录], [玩家战争记录]] = await Promise.all([
        ctx.database.get('马列玩家表', {
            id,
        }),
        ctx.database.get('马列玩家战争表', {
            id,
        }),
    ]);

    if (!玩家档案记录) {
        throw new Error('数据异常：玩家档案不存在，请联系管理员');
    }

    if (!玩家战争记录) {
        throw new Error('数据异常：玩家战争档案不存在，请联系管理员');
    }

    return 合并玩家资料(玩家档案记录, 玩家战争记录);
}

export async function 更新玩家资料(
    ctx: Context,
    id: number,
    更新数据: Partial<玩家完整资料>
): Promise<void> {
    const [[玩家档案记录], [玩家战争记录]] = await Promise.all([
        ctx.database.get('马列玩家表', {
            id,
        }),
        ctx.database.get('马列玩家战争表', {
            id,
        }),
    ]);

    if (!玩家档案记录 || !玩家战争记录) {
        throw new Error('数据异常：玩家档案不完整，无法更新');
    }

    const 玩家更新: Partial<Player> = {};
    const 战争更新: Partial<PlayerWarData> = {};

    for (const [键, 值] of Object.entries(
        更新数据 as Record<string, unknown>
    )) {
        if (键 === 'id' || 键 === 'uid') continue;

        if (键 in 玩家档案记录) {
            (玩家更新 as Record<string, unknown>)[键] = 值;
        }

        if (键 in 玩家战争记录) {
            (战争更新 as Record<string, unknown>)[键] = 值;
        }
    }

    const 任务: Promise<unknown>[] = [];

    if (Object.keys(玩家更新).length > 0) {
        任务.push(
            ctx.database.set(
                '马列玩家表',
                {
                    id,
                },
                玩家更新
            )
        );
    }

    if (Object.keys(战争更新).length > 0) {
        任务.push(
            ctx.database.set(
                '马列玩家战争表',
                {
                    id,
                },
                战争更新
            )
        );
    }

    if (任务.length > 0) {
        await Promise.all(任务);
    }
}

export async function 玩家检查(
    ctx: Context,
    session: Session | undefined
): Promise<玩家解析结果> {
    会话检查(session);

    const { platform, userId } = 用户检查(session);

    const [玩家配置记录] = await ctx.database.get('马列玩家配置表', {
        [platform]: userId,
    });

    if (!玩家配置记录) {
        return 发送并抛出错误(session, '同志，你还未注册', '玩家未注册');
    }

    const [[玩家档案记录], [玩家战争记录]] = await Promise.all([
        ctx.database.get('马列玩家表', {
            id: 玩家配置记录.id,
        }),
        ctx.database.get('马列玩家战争表', {
            id: 玩家配置记录.id,
        }),
    ]);

    if (!玩家档案记录) {
        return 抛出数据异常(
            session,
            '数据异常：已找到账号但未发现玩家档案，请联系管理员',
            '玩家档案不存在'
        );
    }

    if (!玩家战争记录) {
        return 抛出数据异常(
            session,
            '数据异常：已找到账号但未发现玩家战争档案，请联系管理员',
            '玩家战争档案不存在'
        );
    }

    return {
        id: 玩家配置记录.id,
        uid: 玩家配置记录.uid,
        username: 获取玩家展示名称(玩家配置记录),
        用户资料: 合并玩家资料(玩家档案记录, 玩家战争记录),
        用户配置: 玩家配置记录,
    };
}
