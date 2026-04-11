import type { PlayerWarData } from "./战争数据类型";

export interface PlayerBasicData {
    id: number;
    uid: string;

    //状态机
    所在联军: string | null;
    战争保护期: number | null;

    驻扎地区: string | null;
    上次驻扎日期: string;

    今日是否签到: boolean;
    小时是否生产: boolean;

    //状态
    稳定度: number;
    生产次数: number;
    工人工资: number;
    工人招募限额: number;

    //全部资料
    生活资料: number;
    生产技术: number;
    厂房: number;
    工人: number;
    地下工人: number;
    休假工人: number;

    //科技相关
    科技等级: number;
    科技蓝图: number;
    科技池投入: number;
    科技池容量: number;

    //资源
    石油: number;
    铝土矿: number;
    金属铝: number;
    铁矿石: number;
    钢铁: number;
}

export interface Player extends PlayerBasicData, PlayerWarData {}
