import { Schema } from 'koishi';
import type { CoalitionPermissionLevel, TerrainType } from './types';

export interface 联军默认权限配置 {
    成员列表: CoalitionPermissionLevel;
    地区列表: CoalitionPermissionLevel;
    贡献排行: CoalitionPermissionLevel;
    邀请加入联军: CoalitionPermissionLevel;
    设置联军权限: CoalitionPermissionLevel;
    移出联军: CoalitionPermissionLevel;
    我的联军权限: CoalitionPermissionLevel;
    查看地区军事: CoalitionPermissionLevel;
    查看地区铁路: CoalitionPermissionLevel;
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

export interface 铁路类型配置项 {
    类型ID: string;
    类型名称: string;
    需求生产力: number;
    提供运力: number;
}

export interface 土木工程配置 {
    铁路类型列表: 铁路类型配置项[];
    地形惩罚系数: Record<TerrainType, number>;
    跨联军铁路审批过期小时: number;
}

export interface PluginConfig {
    coalitionPermissionDefault: 联军默认权限配置;
    sqids: Sqids配置;
    信号塔: 信号塔配置;
    土木工程: 土木工程配置;
}

export const 默认联军权限配置: 联军默认权限配置 = {
    成员列表: 4,
    地区列表: 4,
    贡献排行: 4,
    邀请加入联军: 3,
    设置联军权限: 4,
    移出联军: 3,
    我的联军权限: 1,
    查看地区军事: 3,
    查看地区铁路: 3,
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
    铁路类型列表: [
        { 类型ID: '铁路1', 类型名称: '轻型铁路', 需求生产力: 1_000_000, 提供运力: 1_000_000 },
        { 类型ID: '铁路2', 类型名称: '标准铁路', 需求生产力: 3_000_000, 提供运力: 4_000_000 },
        { 类型ID: '铁路3', 类型名称: '重型铁路', 需求生产力: 6_000_000, 提供运力: 9_000_000 },
        { 类型ID: '铁路4', 类型名称: '特重铁路', 需求生产力: 10_000_000, 提供运力: 20_000_000 },
    ],
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
    跨联军铁路审批过期小时: 24,
};

export const 默认插件配置: PluginConfig = {
    coalitionPermissionDefault: 默认联军权限配置,
    sqids: 默认Sqids配置,
    信号塔: 默认信号塔配置,
    土木工程: 默认土木工程配置,
};

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
        铁路类型列表: 默认土木工程配置.铁路类型列表.map((配置) => ({ ...配置 })),
        地形惩罚系数: {
            ...默认土木工程配置.地形惩罚系数,
        },
        跨联军铁路审批过期小时: 默认土木工程配置.跨联军铁路审批过期小时,
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
            铁路类型列表: config.土木工程?.铁路类型列表?.length
                ? config.土木工程.铁路类型列表.map((配置) => ({ ...配置 }))
                : 默认土木工程配置.铁路类型列表.map((配置) => ({ ...配置 })),
            地形惩罚系数: {
                ...默认土木工程配置.地形惩罚系数,
                ...(config.土木工程?.地形惩罚系数 ?? {}),
            },
            跨联军铁路审批过期小时:
                config.土木工程?.跨联军铁路审批过期小时 ?? 默认土木工程配置.跨联军铁路审批过期小时,
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

const 权限等级Schema = Schema.union([
    Schema.const(1),
    Schema.const(2),
    Schema.const(3),
    Schema.const(4),
]);

function 创建Sqids单项Schema(默认值: Sqids单项配置): Schema<Sqids单项配置> {
    return Schema.object({
        alphabet: Schema.string()
            .min(3)
            .max(62)
            .default(默认值.alphabet)
            .description('Sqids 字符表（建议不重复字符）'),
        minLength: Schema.number()
            .min(1)
            .max(16)
            .default(默认值.minLength)
            .description('Sqids 最小长度'),
        blocklist: Schema.array(Schema.string())
            .default([...默认值.blocklist])
            .description('Sqids 屏蔽词列表'),
    });
}

function 创建信号塔频道Schema(默认值: 信号塔频道配置): Schema<信号塔频道配置> {
    return Schema.object({
        onebot: Schema.array(Schema.string())
            .default([...默认值.onebot])
            .description('OneBot 群聊ID列表'),
        discord: Schema.array(Schema.string())
            .default([...默认值.discord])
            .description('Discord 频道ID列表'),
        telegram: Schema.array(Schema.string())
            .default([...默认值.telegram])
            .description('Telegram 群聊ID列表'),
    });
}

function 创建铁路类型配置Schema(默认值: 铁路类型配置项): Schema<铁路类型配置项> {
    return Schema.object({
        类型ID: Schema.string().default(默认值.类型ID).description('铁路类型标识（如：铁路1）'),
        类型名称: Schema.string().default(默认值.类型名称).description('铁路展示名称'),
        需求生产力: Schema.number().min(1).default(默认值.需求生产力).description('基础生产力需求'),
        提供运力: Schema.number()
            .min(1)
            .default(默认值.提供运力)
            .description('铁路建成后提供的运力'),
    });
}

function 创建地形惩罚系数Schema(默认值: Record<TerrainType, number>) {
    return Schema.object({
        浅海: Schema.number().min(0.1).default(默认值.浅海),
        中海: Schema.number().min(0.1).default(默认值.中海),
        深海: Schema.number().min(0.1).default(默认值.深海),
        超深海: Schema.number().min(0.1).default(默认值.超深海),
        平原: Schema.number().min(0.1).default(默认值.平原),
        高原: Schema.number().min(0.1).default(默认值.高原),
        浅丘: Schema.number().min(0.1).default(默认值.浅丘),
        深丘: Schema.number().min(0.1).default(默认值.深丘),
        低山: Schema.number().min(0.1).default(默认值.低山),
        中山: Schema.number().min(0.1).default(默认值.中山),
        高山: Schema.number().min(0.1).default(默认值.高山),
    });
}

export const 插件配置Schema: Schema<PluginConfig> = Schema.object({
    coalitionPermissionDefault: Schema.object({
        成员列表: 权限等级Schema.default(默认联军权限配置.成员列表),
        地区列表: 权限等级Schema.default(默认联军权限配置.地区列表),
        贡献排行: 权限等级Schema.default(默认联军权限配置.贡献排行),
        邀请加入联军: 权限等级Schema.default(默认联军权限配置.邀请加入联军),
        设置联军权限: 权限等级Schema.default(默认联军权限配置.设置联军权限),
        移出联军: 权限等级Schema.default(默认联军权限配置.移出联军),
        我的联军权限: 权限等级Schema.default(默认联军权限配置.我的联军权限),
        查看地区军事: 权限等级Schema.default(默认联军权限配置.查看地区军事),
        查看地区铁路: 权限等级Schema.default(默认联军权限配置.查看地区铁路),
        查看地区生物实验室: 权限等级Schema.default(默认联军权限配置.查看地区生物实验室),
        查看地区核反应堆: 权限等级Schema.default(默认联军权限配置.查看地区核反应堆),
        查看地区离心机组: 权限等级Schema.default(默认联军权限配置.查看地区离心机组),
        设置地区驻扎权限: 权限等级Schema.default(默认联军权限配置.设置地区驻扎权限),
        分配生活资料: 权限等级Schema.default(默认联军权限配置.分配生活资料),
        分配历史记录: 权限等级Schema.default(默认联军权限配置.分配历史记录),
        设置税率: 权限等级Schema.default(默认联军权限配置.设置税率),
        设置扩军计划: 权限等级Schema.default(默认联军权限配置.设置扩军计划),
        转入联军: 权限等级Schema.default(默认联军权限配置.转入联军),
        分配军队: 权限等级Schema.default(默认联军权限配置.分配军队),
    }).description('联军默认权限配置'),
    sqids: Schema.object({
        register: 创建Sqids单项Schema(默认Sqids配置.register).description('玩家 UID 生成参数'),
        coalition: 创建Sqids单项Schema(默认Sqids配置.coalition).description('联军编号生成参数'),
    }).description('Sqids 配置'),
    信号塔: Schema.object({
        新闻群: 创建信号塔频道Schema(默认信号塔配置.新闻群).description('新闻广播群配置'),
        后台群: 创建信号塔频道Schema(默认信号塔配置.后台群).description('后台日志群配置'),
    }).description('信号塔配置'),
    土木工程: Schema.object({
        铁路类型列表: Schema.array(创建铁路类型配置Schema(默认土木工程配置.铁路类型列表[0]))
            .default(默认土木工程配置.铁路类型列表.map((配置) => ({ ...配置 })))
            .description('铁路类型与基础生产力配置'),
        地形惩罚系数: 创建地形惩罚系数Schema(默认土木工程配置.地形惩罚系数).description(
            '地形导致的铁路建造成本倍率'
        ),
        跨联军铁路审批过期小时: Schema.number()
            .min(1)
            .max(168)
            .default(默认土木工程配置.跨联军铁路审批过期小时)
            .description('跨联军铁路申请自动失效小时数'),
    }).description('土木工程配置'),
});
