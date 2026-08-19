export type CoalitionPermissionLevel = 1 | 2 | 3 | 4;

export type CoalitionPermissionAction =
    | "成员列表"
    | "地区列表"
    | "贡献排行"
    | "邀请加入联军"
    | "设置联军权限"
    | "移出联军"
    | "我的联军权限"
    | "查看地区军事"
    | "查看地区生物实验室"
    | "查看地区核反应堆"
    | "查看地区离心机组"
    | "设置地区驻扎权限"
    | "分配生活资料"
    | "分配历史记录"
    | "设置税率"
    | "设置扩军计划"
    | "转入联军"
    | "分配军队"
    | "设置地区总督"
    | "设置地区司令"
    | "部署列车炮"
    | "列车炮炮击"
    | "授衔"
    | "任命指挥官";

export interface CoalitionPermission {
    联军编号: string;
    成员列表: CoalitionPermissionLevel;
    地区列表: CoalitionPermissionLevel;
    贡献排行: CoalitionPermissionLevel;
    邀请加入联军: CoalitionPermissionLevel;
    设置联军权限: CoalitionPermissionLevel;
    移出联军: CoalitionPermissionLevel;
    我的联军权限: CoalitionPermissionLevel;
    查看地区军事: CoalitionPermissionLevel;
    查看地区生物实验室: CoalitionPermissionLevel;
    查看地区核反应堆: CoalitionPermissionLevel;
    查看地区离心机组: CoalitionPermissionLevel;
    设置地区驻扎权限: CoalitionPermissionLevel;
    分配生活资料: CoalitionPermissionLevel;
    分配历史记录: CoalitionPermissionLevel;
    设置税率: CoalitionPermissionLevel;
    设置扩军计划: CoalitionPermissionLevel;
    转入联军: CoalitionPermissionLevel;
    分配军队: CoalitionPermissionLevel;
    设置地区总督: CoalitionPermissionLevel;
    设置地区司令: CoalitionPermissionLevel;
    部署列车炮: CoalitionPermissionLevel;
    列车炮炮击: CoalitionPermissionLevel;
    授衔: CoalitionPermissionLevel;
    任命指挥官: CoalitionPermissionLevel;
}
