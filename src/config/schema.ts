import { Schema } from 'koishi';
import type { TerrainType } from '../types';
import type { Sqids单项配置, 信号塔频道配置, 铁路类型配置项, PluginConfig } from './types';
import {
    默认联军权限配置,
    默认Sqids配置,
    默认信号塔配置,
    默认土木工程配置,
    默认地理配置,
} from './defaults';

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
    地理: Schema.object({
        铁路距离基准公里: Schema.number()
            .min(100)
            .default(默认地理配置.铁路距离基准公里)
            .description('铁路建造成本距离基准（公里），距离惩罚以此归一化'),
        铁路距离惩罚率: Schema.number()
            .min(0)
            .max(5)
            .step(0.1)
            .default(默认地理配置.铁路距离惩罚率)
            .description('铁路建造成本距离惩罚率，0=无惩罚，1=每基准距离翻倍'),
        列车炮最大射程公里: Schema.number()
            .min(10)
            .default(默认地理配置.列车炮最大射程公里)
            .description('列车炮最大射程（公里）'),
        默认行军速度公里每天: Schema.number()
            .min(1)
            .default(默认地理配置.默认行军速度公里每天)
            .description('默认行军速度（公里/天）'),
        默认铁路速度公里每天: Schema.number()
            .min(10)
            .default(默认地理配置.默认铁路速度公里每天)
            .description('默认铁路运输速度（公里/天）'),
        默认空运速度公里每天: Schema.number()
            .min(100)
            .default(默认地理配置.默认空运速度公里每天)
            .description('默认空运速度（公里/天）'),
    }).description('地理空间配置'),
});
