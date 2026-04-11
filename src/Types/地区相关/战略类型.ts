/**
 * 所有时间记录都用 YYYY-MM-DD HH:mm
 */

export interface WarRecord {
    发动者: string;
    发动国?: string;
    记录: string;
    时间: string;
}

export interface RailRecord {
    运输者: string;
    运输物: string;
    时间: string;
}

export type RailStatus = "正常" | "中断" | "维修中" | "被破坏" | "建设中";

export interface Railroad {
    // 铁路通向的目标地区(编号)
    目标地区: string;

    铁路状态: RailStatus;

    铁路运力: number;
    当前负载: number;

    开通时间: string;

    铁路日志: RailRecord[];
}

export interface RegionStrategy {
    地区编号: string;

    地区司令: string;

    // 战略运输

    铁路: Record<number, Railroad>;

    // 地区军事
    地区驻军: number;
    地区堡垒: number;

    已部署列车炮: number;
    空闲的列车炮: number;

    历史战争: WarRecord[];
}
