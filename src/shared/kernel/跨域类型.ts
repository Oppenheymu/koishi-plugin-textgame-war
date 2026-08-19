import type { CoalitionArmy, CoalitionPermissionLevel } from "#ctx/coalition";
import type { Player, PlayerConfig, PlayerWarData } from "#ctx/player";

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
