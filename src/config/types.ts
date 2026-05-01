import type { CoalitionPermissionLevel, TerrainType } from '../types';

export interface 联军默认权限配置 {
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
}

export interface Sqids单项配置 {
    alphabet: string;
    minLength: number;
    blocklist: string[];
}

export interface Sqids配置 {
    register: Sqids单项配置;
    coalition: Sqids单项配置;
}

export interface 信号塔频道配置 {
    onebot: string[];
    discord: string[];
    telegram: string[];
}

export interface 信号塔配置 {
    新闻群: 信号塔频道配置;
    后台群: 信号塔频道配置;
}

export interface 土木工程配置 {
    地形惩罚系数: Record<TerrainType, number>;
}

export interface 地理配置 {
    列车炮最大射程公里: number;
    默认行军速度公里每天: number;
    默认空运速度公里每天: number;
}

export interface PluginConfig {
    coalitionPermissionDefault: 联军默认权限配置;
    sqids: Sqids配置;
    信号塔: 信号塔配置;
    土木工程: 土木工程配置;
    地理: 地理配置;
}
