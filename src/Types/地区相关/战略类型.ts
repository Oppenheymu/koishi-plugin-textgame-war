/**
 * 所有时间记录都用 YYYY-MM-DD HH:mm
 */

interface WarRecord {
    发动者: string;
    发动国?: string;
    记录: string;
    时间: string;
}

type Preparation = '浓缩铀' | '钚' | '生物武器';

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
    是否制备中: boolean;

    建造进度: number;
    建造时间: string;

    日志: PrepareRecord[];
}

interface NuclearReactor {
    是否制备中: boolean;

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

export type Fortress =
    | '一级要塞'
    | '二级要塞'
    | '三级要塞'
    | '四级要塞'
    | '五级要塞'
    | '六级要塞'
    | '七级要塞';

export interface RegionStrategy {
    地区编号: string;

    地区司令: string;

    // 仓储
    地区仓库: Warehouse;

    // 地区军事
    地区驻军: number;
    地区堡垒: Fortress | undefined;

    生物实验室: Record<number, BiologyLab>;

    高速离心级联: Record<number, Centrifuge>;
    核反应堆: Record<number, NuclearReactor>;

    已部署列车炮: number;
    空闲的列车炮: number;

    历史战争: WarRecord[];
}
