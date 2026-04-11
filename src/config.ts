import {
    Schema
} from "koishi";
import type {
    CoalitionPermissionLevel
} from "./types";

export interface 联军默认权限配置 {
    成员列表: CoalitionPermissionLevel;
    地区列表: CoalitionPermissionLevel;
    贡献排行: CoalitionPermissionLevel;
    邀请加入联军: CoalitionPermissionLevel;
    设置联军权限: CoalitionPermissionLevel;
    移出联军: CoalitionPermissionLevel;
    我的联军权限: CoalitionPermissionLevel;
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

export interface PluginConfig {
    coalitionPermissionDefault: 联军默认权限配置;
    sqids: Sqids配置;
}

export const 默认联军权限配置: 联军默认权限配置 = {
    成员列表: 4,
    地区列表: 4,
    贡献排行: 4,
    邀请加入联军: 3,
    设置联军权限: 4,
    移出联军: 3,
    我的联军权限: 1,
};

export const 默认Sqids配置: Sqids配置 = {
    register: {
        alphabet: "4027159386",
        minLength: 6,
        blocklist: [],
    },
    coalition: {
        alphabet: "9087564312",
        minLength: 5,
        blocklist: [],
    },
};

export const 默认插件配置: PluginConfig = {
    coalitionPermissionDefault: 默认联军权限配置,
    sqids: 默认Sqids配置,
};

let 当前运行时配置: PluginConfig = {
    coalitionPermissionDefault: {
        ...默认联军权限配置
    },
    sqids: {
        register: {
            ...默认Sqids配置.register
        },
        coalition: {
            ...默认Sqids配置.coalition
        },
    },
};

export function 初始化插件运行时配置(config: Partial < PluginConfig > ) {
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
    };
}

export function 获取运行时配置(): Readonly < PluginConfig > {
    return 当前运行时配置;
}

export function 获取默认联军权限配置(): 联军默认权限配置 {
    return {
        ...当前运行时配置.coalitionPermissionDefault
    };
}

const 权限等级Schema = Schema.union([
    Schema.const(1),
    Schema.const(2),
    Schema.const(3),
    Schema.const(4),
]);

function 创建Sqids单项Schema(默认值: Sqids单项配置): Schema < Sqids单项配置 > {
    return Schema.object({
        alphabet: Schema.string()
            .min(3)
            .max(62)
            .default(默认值.alphabet)
            .description("Sqids 字符表（建议不重复字符）"),
        minLength: Schema.number()
            .min(1)
            .max(16)
            .default(默认值.minLength)
            .description("Sqids 最小长度"),
        blocklist: Schema.array(Schema.string())
            .default([...默认值.blocklist])
            .description("Sqids 屏蔽词列表"),
    });
}

export const 插件配置Schema: Schema < PluginConfig > = Schema.object({
    coalitionPermissionDefault: Schema.object({
        成员列表: 权限等级Schema.default(默认联军权限配置.成员列表),
        地区列表: 权限等级Schema.default(默认联军权限配置.地区列表),
        贡献排行: 权限等级Schema.default(默认联军权限配置.贡献排行),
        邀请加入联军: 权限等级Schema.default(默认联军权限配置.邀请加入联军),
        设置联军权限: 权限等级Schema.default(默认联军权限配置.设置联军权限),
        移出联军: 权限等级Schema.default(默认联军权限配置.移出联军),
        我的联军权限: 权限等级Schema.default(默认联军权限配置.我的联军权限),
    }).description("联军默认权限配置"),
    sqids: Schema.object({
        register: 创建Sqids单项Schema(默认Sqids配置.register).description(
            "玩家 UID 生成参数"
        ),
        coalition: 创建Sqids单项Schema(默认Sqids配置.coalition).description(
            "联军编号生成参数"
        ),
    }).description("Sqids 配置"),
});