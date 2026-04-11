export type CoalitionPermissionLevel = 1 | 2 | 3 | 4;

export type CoalitionPermissionAction =
    | "成员列表"
    | "地区列表"
    | "贡献排行"
    | "邀请加入联军"
    | "设置联军权限"
    | "移出联军"
    | "我的联军权限";

export interface CoalitionPermission {
    联军编号: string;
    成员列表: CoalitionPermissionLevel;
    地区列表: CoalitionPermissionLevel;
    贡献排行: CoalitionPermissionLevel;
    邀请加入联军: CoalitionPermissionLevel;
    设置联军权限: CoalitionPermissionLevel;
    移出联军: CoalitionPermissionLevel;
    我的联军权限: CoalitionPermissionLevel;
}
