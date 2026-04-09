import { Schema } from "koishi";

export interface CacheConfig {
    enabled: boolean;
    defaultTTL: number;
    maxEntries: number;
    regionTTL: number;
    playerTTL: number;
    coalitionTTL: number;
    adminAuthority: number;
    debug: boolean;
}

export interface PluginConfig {
    cache: CacheConfig;
}

export const 默认缓存配置: CacheConfig = {
    enabled: true,
    defaultTTL: 15,
    maxEntries: 512,
    regionTTL: 15,
    playerTTL: 10,
    coalitionTTL: 10,
    adminAuthority: 3,
    debug: false,
};

export const 插件配置Schema: Schema<PluginConfig> = Schema.object({
    cache: Schema.object({
        enabled: Schema.boolean().default(默认缓存配置.enabled).description("是否启用统一缓存"),
        defaultTTL: Schema.number()
            .min(1)
            .max(3600)
            .default(默认缓存配置.defaultTTL)
            .description("默认缓存 TTL（秒）"),
        maxEntries: Schema.number()
            .min(32)
            .max(10000)
            .default(默认缓存配置.maxEntries)
            .description("缓存最大条目数（超出后淘汰最早条目）"),
        regionTTL: Schema.number()
            .min(1)
            .max(3600)
            .default(默认缓存配置.regionTTL)
            .description("地区解析缓存 TTL（秒）"),
        playerTTL: Schema.number()
            .min(1)
            .max(3600)
            .default(默认缓存配置.playerTTL)
            .description("玩家解析缓存 TTL（秒）"),
        coalitionTTL: Schema.number()
            .min(1)
            .max(3600)
            .default(默认缓存配置.coalitionTTL)
            .description("联军解析缓存 TTL（秒）"),
        adminAuthority: Schema.number()
            .min(0)
            .max(4)
            .default(默认缓存配置.adminAuthority)
            .description("缓存管理命令所需权限等级"),
        debug: Schema.boolean().default(默认缓存配置.debug).description("是否输出缓存调试日志"),
    }).description("缓存配置"),
});
