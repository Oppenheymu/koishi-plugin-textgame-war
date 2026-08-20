import type { 装备数量列 } from "#ctx/military";

export interface PlayerWarData extends 装备数量列 {
    id: number;
    uid: string;

    // 空军状态机
    巡航中的预警机: number;
    巡航中的战斗机: number;

    // 地堡相关
    地下工厂投入: number;
    是否有地下工厂: boolean;
    地下机库投入: number;
    是否有地下机库: boolean;
    地下弹药库投入: number;
    是否有地下弹药库: boolean;

    // 地下机库相关
    地下侦察机: number;
    地下战斗机: number;
    地下预警机: number;
    地下战术轰炸机: number;
    地下战略轰炸机: number;
    地下隐形轰炸机: number;
    地下大型运输机: number;
    地下小型运输机: number;

    // 地下弹药库相关
    地下火箭弹: number;
    地下防空弹药: number;
}
