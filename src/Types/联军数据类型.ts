export enum 联军政体 {
    民主制 = "民主制",
    威权制 = "威权制",
    极权制 = "极权制",
}

export interface MemberData {
    联军贡献: number;
    加入时间: string;
}

export interface CoalitionArmy {
    id: number;
    联军编号: string;

    // 联军属性
    联军元首: string;
    联军总理: string;

    联军一级权限成员列表: string[];
    联军二级权限成员列表: string[];
    联军三级权限成员列表: string[];

    联军政治体制: 联军政体;

    // 联军基础数据
    联军成员数量: number;
    联军成员列表: Record<string, MemberData>;


    联军首都: string;
    联军地区列表: string[];

    // 联军数据

    联军军队: number;
    联军生活资料: number;

    // 联军宣称数据
    联军宣称人口: number;
    联军宣称兵力: number;

    // 联军状态机
    联军税率: number;

    联军名称: string;
    名称是否审核: boolean;

    建立日期: string;
    上次改名日期: string;

}
