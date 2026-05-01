import type { PluginConfig, 联军默认权限配置 } from './types';
import {
    默认联军权限配置,
    默认Sqids配置,
    默认信号塔配置,
    默认土木工程配置,
    默认地理配置,
} from './defaults';

let 当前运行时配置: PluginConfig = {
    coalitionPermissionDefault: {
        ...默认联军权限配置,
    },
    sqids: {
        register: {
            ...默认Sqids配置.register,
        },
        coalition: {
            ...默认Sqids配置.coalition,
        },
    },
    信号塔: {
        新闻群: {
            onebot: [...默认信号塔配置.新闻群.onebot],
            discord: [...默认信号塔配置.新闻群.discord],
            telegram: [...默认信号塔配置.新闻群.telegram],
        },
        后台群: {
            onebot: [...默认信号塔配置.后台群.onebot],
            discord: [...默认信号塔配置.后台群.discord],
            telegram: [...默认信号塔配置.后台群.telegram],
        },
    },
    土木工程: {
        地形惩罚系数: {
            ...默认土木工程配置.地形惩罚系数,
        },
    },
    地理: {
        ...默认地理配置,
    },
};

export function 初始化插件运行时配置(config: Partial<PluginConfig>) {
    当前运行时配置 = {
        coalitionPermissionDefault: {
            ...默认联军权限配置,
            ...(config.coalitionPermissionDefault ?? {}),
        },
        sqids: {
            register: {
                ...默认Sqids配置.register,
                ...(config.sqids?.register ?? {}),
            },
            coalition: {
                ...默认Sqids配置.coalition,
                ...(config.sqids?.coalition ?? {}),
            },
        },
        信号塔: {
            新闻群: {
                onebot: config.信号塔?.新闻群?.onebot
                    ? [...config.信号塔.新闻群.onebot]
                    : [...默认信号塔配置.新闻群.onebot],
                discord: config.信号塔?.新闻群?.discord
                    ? [...config.信号塔.新闻群.discord]
                    : [...默认信号塔配置.新闻群.discord],
                telegram: config.信号塔?.新闻群?.telegram
                    ? [...config.信号塔.新闻群.telegram]
                    : [...默认信号塔配置.新闻群.telegram],
            },
            后台群: {
                onebot: config.信号塔?.后台群?.onebot
                    ? [...config.信号塔.后台群.onebot]
                    : [...默认信号塔配置.后台群.onebot],
                discord: config.信号塔?.后台群?.discord
                    ? [...config.信号塔.后台群.discord]
                    : [...默认信号塔配置.后台群.discord],
                telegram: config.信号塔?.后台群?.telegram
                    ? [...config.信号塔.后台群.telegram]
                    : [...默认信号塔配置.后台群.telegram],
            },
        },
        土木工程: {
            地形惩罚系数: {
                ...默认土木工程配置.地形惩罚系数,
                ...(config.土木工程?.地形惩罚系数 ?? {}),
            },
        },
        地理: {
            ...默认地理配置,
            ...(config.地理 ?? {}),
        },
    };
}

export function 获取运行时配置(): Readonly<PluginConfig> {
    return 当前运行时配置;
}

export function 获取默认联军权限配置(): 联军默认权限配置 {
    return {
        ...当前运行时配置.coalitionPermissionDefault,
    };
}
