export type 改名类型 = "玩家" | "联军" | "地区";
export type 工单状态 = "待审核" | "已通过" | "已驳回";

export interface 改名审核工单 {
    工单编号: number;
    类型: 改名类型;
    新名称: string;
    申请人ID: number;
    申请人UID: string;
    申请人名称: string;
    玩家ID?: number;
    联军编号?: string;
    地区编号?: string;
    状态: 工单状态;
    创建时间: string;
    驳回原因?: string;
}
