import {} from "@koishijs/cache";

declare module "@koishijs/cache" {
    interface Tables {
        "malie-textgame:region": unknown;
        "malie-textgame:player": unknown;
        "malie-textgame:coalition": unknown;
        "malie-textgame:default": unknown;
    }
}

export type 缓存分组 = "region" | "player" | "coalition" | "default";

export interface 统一缓存配置 {
    enabled: boolean;
    defaultTTL: number;
    regionTTL: number;
    playerTTL: number;
    coalitionTTL: number;
    adminAuthority: number;
}

export type 缓存概览 = {
    enabled: boolean;
    size: number;
};

export const 默认缓存配置: 统一缓存配置 = {
    enabled: true,
    defaultTTL: 15,
    regionTTL: 60,
    playerTTL: 10,
    coalitionTTL: 10,
    adminAuthority: 3,
};
