/**
 * 所有时间记录都用 YYYY-MM-DD HH:mm
 */

interface WarRecord {
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

export type RailStatus = '正常' | '中断' | '维修中' | '被破坏' | '建设中';

export interface Railroad {
    // 铁路通向的目标地区(编号)
    目标地区: string;

    // 铁路来源地区（即发起修建的地区）
    来源地区: string;

    铁路类型: string;
    建造需求: number;
    已投入生产力: number;

    建造进度: number;
    铁路状态: RailStatus;

    铁路运力: number;
    当前负载: number;

    开通时间: string;

    铁路日志: RailRecord[];
}

type Preparation = '浓缩铀' | '钚' | '生物武器' | '化学武器';

// 制备（生物武器、化学武器的）记录
interface PrepareRecord {
    制备者: string;

    制备物: Preparation;
    数量: number;

    时间: string;
}

interface BiologyLab {
    是否制备中: boolean;

    建造进度: number;
    建造时间: string;

    日志: PrepareRecord[];
}

interface Centrifuge {
    是否运行中: boolean;

    建造进度: number;
    建造时间: string;

    日志: PrepareRecord[];
}

interface NuclearReactor {
    是否运行中: boolean;

    建造进度: number;
    建造时间: string;

    日志: PrepareRecord[];
}

export interface Warehouse {
    // 资源
    石油: number;
    铝土矿: number;
    金属铝: number;
    铁矿石: number;
    钢铁: number;

    // 军事
    步兵装备: number;
    重炮: number;
    火箭炮: number;
    火箭炮弹药: number;
    防空弹药: number;
}

export interface RegionStrategy {
    地区编号: string;

    地区司令: string;

    // 仓储
    地区仓库: Warehouse;

    // 运输
    铁路: Record<number, Railroad>;
    是否有铁路: boolean;

    // 地区军事
    地区驻军: number;
    地区堡垒: number;

    生物实验室: Record<number, BiologyLab>;

    高速离心级联: Record<number, Centrifuge>;
    核反应堆: Record<number, NuclearReactor>;

    已部署列车炮: number;
    空闲的列车炮: number;

    历史战争: WarRecord[];
}

export type RailBuildPendingStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'expired';

export interface PendingRailwayBuild {
    id: string;
    状态: RailBuildPendingStatus;

    申请人ID: number;
    申请人UID: string;
    申请人名称: string;

    发起联军编号: string;
    发起联军名称: string;
    发起地区编号: string;

    目标地区编号: string;
    目标联军编号: string;
    目标联军名称: string;

    铁路类型: string;
    铁路类型名称: string;
    最终需求生产力: number;
    提供运力: number;

    已投入生产力: number;

    创建时间: string;
    更新时间: string;
    过期时间: string;

    审批人UID: string;
    审批备注: string;
}
