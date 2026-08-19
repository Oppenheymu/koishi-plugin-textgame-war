import type { CoalitionPermissionLevel } from "#ctx/coalition/domain/types/联军权限类型";
import type { CoalitionArmy } from "#ctx/coalition/domain/types/联军数据类型";
import type { Player } from "#ctx/player/domain/types/基本类型";
import type { PlayerConfig } from "#ctx/player/domain/types/配置类型";
import type { PlayerWarData } from "#ctx/player/domain/types/战争类型";

export type 联军权限等级 = CoalitionPermissionLevel;

export type 支持平台 = keyof Pick<PlayerConfig, "onebot" | "discord" | "telegram">;

export type 玩家完整资料 = Player & PlayerWarData;

export interface 玩家解析结果 {
    id: number;
    uid: string;
    username: string;
    用户资料: 玩家完整资料;
    用户配置: PlayerConfig;
}

export interface 玩家联军检查选项 {
    最低权限等级?: 联军权限等级;
    是否必须在成员列表?: boolean;
}

export type 玩家联军解析结果 = 玩家解析结果 & {
    联军资料: CoalitionArmy;
    联军编号: string;
    权限等级: 联军权限等级;
};
