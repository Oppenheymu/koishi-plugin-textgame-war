export type 缓存分组 = "region" | "player" | "coalition" | "default";

export interface 统一缓存配置 {
    enabled: boolean;
    defaultTTL: number;
    maxEntries: number;
    regionTTL: number;
    playerTTL: number;
    coalitionTTL: number;
    adminAuthority: number;
    debug: boolean;
}

export type 缓存记录 = {
    value: unknown;
    expiresAt: number;
};

export type 缓存状态 = {
    enabled: boolean;
    size: number;
    inflight: number;
    maxEntries: number;
    hit: number;
    miss: number;
    load: number;
    evict: number;
};

export const 默认缓存配置: 统一缓存配置 = {
    enabled: true,
    defaultTTL: 15,
    maxEntries: 512,
    regionTTL: 15,
    playerTTL: 10,
    coalitionTTL: 10,
    adminAuthority: 3,
    debug: false,
};
