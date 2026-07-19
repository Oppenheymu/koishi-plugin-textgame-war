import type { Context } from 'koishi';
import type { Player, PlayerWarData } from '#/types';
import type { 玩家完整资料 } from '../types';

export function 合并玩家资料(玩家档案记录: Player, 玩家战争记录: PlayerWarData): 玩家完整资料 {
    return {
        ...玩家档案记录,
        ...玩家战争记录,
    };
}

export async function 获取玩家完整资料(ctx: Context, id: number): Promise<玩家完整资料> {
    const [[玩家档案记录], [玩家战争记录]] = await Promise.all([
        ctx.database.get('马列玩家表', { id }),
        ctx.database.get('马列玩家战争表', { id }),
    ]);

    if (!玩家档案记录) {
        throw new Error('数据异常：玩家档案不存在，请联系管理员');
    }

    if (!玩家战争记录) {
        throw new Error('数据异常：玩家战争档案不存在，请联系管理员');
    }

    return 合并玩家资料(玩家档案记录, 玩家战争记录);
}
