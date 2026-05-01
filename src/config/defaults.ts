import type {
    联军默认权限配置,
    Sqids配置,
    信号塔频道配置,
    信号塔配置,
    土木工程配置,
    地理配置,
    PluginConfig,
} from './types';

export const 默认联军权限配置: 联军默认权限配置 = {
    成员列表: 4,
    地区列表: 4,
    贡献排行: 4,
    邀请加入联军: 3,
    设置联军权限: 4,
    移出联军: 3,
    我的联军权限: 1,
    查看地区军事: 3,
    查看地区生物实验室: 3,
    查看地区核反应堆: 4,
    查看地区离心机组: 4,
    设置地区驻扎权限: 3,
    分配生活资料: 3,
    分配历史记录: 1,
    设置税率: 4,
    设置扩军计划: 4,
    转入联军: 1,
    分配军队: 3,
};

export const 默认Sqids配置: Sqids配置 = {
    register: {
        alphabet: '4027159386',
        minLength: 6,
        blocklist: [],
    },
    coalition: {
        alphabet: '9087564312',
        minLength: 5,
        blocklist: [],
    },
};

export const 默认信号塔频道配置: 信号塔频道配置 = {
    onebot: [],
    discord: [],
    telegram: [],
};

export const 默认信号塔配置: 信号塔配置 = {
    新闻群: {
        ...默认信号塔频道配置,
        onebot: [...默认信号塔频道配置.onebot],
        discord: [...默认信号塔频道配置.discord],
        telegram: [...默认信号塔频道配置.telegram],
    },
    后台群: {
        ...默认信号塔频道配置,
        onebot: [...默认信号塔频道配置.onebot],
        discord: [...默认信号塔频道配置.discord],
        telegram: [...默认信号塔频道配置.telegram],
    },
};

export const 默认土木工程配置: 土木工程配置 = {
    地形惩罚系数: {
        浅海: 1.8,
        中海: 2,
        深海: 2.2,
        超深海: 2.5,
        平原: 1,
        高原: 1.08,
        浅丘: 1.12,
        深丘: 1.18,
        低山: 1.25,
        中山: 1.35,
        高山: 1.5,
    },
};

export const 默认地理配置: 地理配置 = {
    列车炮最大射程公里: 100,
    默认行军速度公里每天: 40,
    默认空运速度公里每天: 2000,
};

export const 默认插件配置: PluginConfig = {
    coalitionPermissionDefault: 默认联军权限配置,
    sqids: 默认Sqids配置,
    信号塔: 默认信号塔配置,
    土木工程: 默认土木工程配置,
    地理: 默认地理配置,
};
