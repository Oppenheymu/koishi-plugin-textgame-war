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

type 缓存记录 = {
    value: unknown;
    expiresAt: number;
};

type 缓存状态 = {
    enabled: boolean;
    size: number;
    inflight: number;
    maxEntries: number;
    hit: number;
    miss: number;
    load: number;
    evict: number;
};

const 默认配置: 统一缓存配置 = {
    enabled: true,
    defaultTTL: 15,
    maxEntries: 512,
    regionTTL: 15,
    playerTTL: 10,
    coalitionTTL: 10,
    adminAuthority: 3,
    debug: false,
};

let 当前配置: 统一缓存配置 = { ...默认配置 };

const 缓存表 = new Map<string, 缓存记录>();
const 进行中表 = new Map<string, Promise<unknown>>();

const 统计 = {
    hit: 0,
    miss: 0,
    load: 0,
    evict: 0,
};

function 过期清理() {
    const 当前时间 = Date.now();
    for (const [key, record] of 缓存表) {
        if (record.expiresAt <= 当前时间) {
            缓存表.delete(key);
            统计.evict += 1;
        }
    }
}

function 输出调试日志(消息: string) {
    if (当前配置.debug) {
        console.debug(`[统一缓存] ${消息}`);
    }
}

function 确保容量() {
    while (缓存表.size > 当前配置.maxEntries) {
        const 最早键 = 缓存表.keys().next().value;
        if (!最早键) break;
        缓存表.delete(最早键);
        统计.evict += 1;
    }
}

function 读取缓存<T>(key: string): T | undefined {
    if (!当前配置.enabled) {
        return undefined;
    }

    const record = 缓存表.get(key);
    if (!record) {
        统计.miss += 1;
        return undefined;
    }

    if (record.expiresAt <= Date.now()) {
        缓存表.delete(key);
        统计.miss += 1;
        统计.evict += 1;
        return undefined;
    }

    缓存表.delete(key);
    缓存表.set(key, record);
    统计.hit += 1;
    return record.value as T;
}

export function 初始化统一缓存配置(配置: Partial<统一缓存配置>) {
    当前配置 = {
        ...默认配置,
        ...配置,
    };

    过期清理();
    确保容量();
    输出调试日志("缓存配置已更新");
}

export function 获取统一缓存配置(): Readonly<统一缓存配置> {
    return 当前配置;
}

export function 获取分组缓存TTL毫秒(分组: 缓存分组): number {
    const 秒数映射: Record<缓存分组, number> = {
        region: 当前配置.regionTTL,
        player: 当前配置.playerTTL,
        coalition: 当前配置.coalitionTTL,
        default: 当前配置.defaultTTL,
    };

    return 秒数映射[分组] * 1000;
}

export function 构造缓存键(分组: 缓存分组 | string, key: string): string {
    return `${分组}:${key}`;
}

export function 写入缓存<T>(key: string, value: T, ttl毫秒: number) {
    if (!当前配置.enabled) {
        return;
    }

    缓存表.delete(key);
    缓存表.set(key, {
        value,
        expiresAt: Date.now() + Math.max(1, ttl毫秒),
    });

    确保容量();
    输出调试日志(`写入 ${key}`);
}

export function 删除缓存(key: string): boolean {
    const removed = 缓存表.delete(key);
    if (removed) {
        输出调试日志(`删除 ${key}`);
    }
    return removed;
}

export function 按前缀删除缓存(prefix: string): number {
    if (!prefix.trim()) {
        return 0;
    }

    let count = 0;
    for (const key of 缓存表.keys()) {
        if (key.startsWith(prefix)) {
            缓存表.delete(key);
            count += 1;
        }
    }

    if (count > 0) {
        输出调试日志(`按前缀删除 ${prefix}，共 ${count} 条`);
    }
    return count;
}

export function 清空缓存(): number {
    const 当前数量 = 缓存表.size;
    缓存表.clear();
    输出调试日志(`清空缓存 ${当前数量} 条`);
    return 当前数量;
}

export async function 缓存获取或加载<T>(
    key: string,
    加载器: () => Promise<T>,
    ttl毫秒: number,
): Promise<T> {
    const 命中 = 读取缓存<T>(key);
    if (命中 !== undefined) {
        return 命中;
    }

    const 进行中 = 进行中表.get(key) as Promise<T> | undefined;
    if (进行中) {
        return 进行中;
    }

    const 任务 = (async () => {
        统计.load += 1;
        const 数据 = await 加载器();
        写入缓存(key, 数据, ttl毫秒);
        return 数据;
    })();

    进行中表.set(key, 任务 as Promise<unknown>);

    try {
        return await 任务;
    } finally {
        进行中表.delete(key);
    }
}

export function 获取缓存状态(): 缓存状态 {
    过期清理();
    return {
        enabled: 当前配置.enabled,
        size: 缓存表.size,
        inflight: 进行中表.size,
        maxEntries: 当前配置.maxEntries,
        hit: 统计.hit,
        miss: 统计.miss,
        load: 统计.load,
        evict: 统计.evict,
    };
}
