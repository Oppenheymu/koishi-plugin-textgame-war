import type { Player } from "#ctx/player/domain/types/基本类型";
import type { PlayerWarData } from "#ctx/player/domain/types/战争类型";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";

export function 合并玩家资料(玩家档案记录: Player, 玩家战争记录: PlayerWarData): 玩家完整资料 {
    return {
        ...玩家档案记录,
        ...玩家战争记录,
    };
}
