import type { Player, PlayerWarData } from "#/types";
import type { 玩家完整资料 } from "../types.js";

export function 合并玩家资料(玩家档案记录: Player, 玩家战争记录: PlayerWarData): 玩家完整资料 {
    return {
        ...玩家档案记录,
        ...玩家战争记录,
    };
}
