
import {} from "@koishijs/cache";
import { Context } from "koishi";
import {
    默认缓存配置,
    缓存分组,
    缓存概览,
    统一缓存配置,
} from "./types";

const 缓存表映射 = {
    region: "malie-textgame:region",
    player: "malie-textgame:player",
    coalition: "malie-textgame:coalition",
    default: "malie-textgame:default",
} as const;

const 已知缓存分组 = Object.keys(缓存表映射) as 缓存分组[];
type 缓存表名 = (typeof 缓存表映射)[缓存分组];

let 当前配置: 统一缓存配置 = { ...默认缓存配置 };
let 当前上下文: Context | undefined;

// 将泛型指定为 any，在获取时再通过泛型 T 进行断言，减少不必要的 unknown 强转
const 进行中表 = new Map<string, Promise<any>>();

function 获取缓存服务() {
    return 当前上下文?.cache;
}

function 解析缓存键(key: string): { 分组: 缓存分组; 原始键: string; 表名: 缓存表名 } {
    const 分隔位置 = key.indexOf(":");

    // 如果没有分隔符，直接返回 default
    if (分隔位置 < 0) {
        return { 分组: "default", 原始键: key, 表名: 缓存表映射.default };
    }

    const 原始分组 = key.slice(0, 分隔位置);
    const 原始键 = key.slice(分隔位置 + 1);

    // 利用 in 操作符进行安全的键值判断
    const 分组: 缓存分组 = (原始分组 in 缓存表映射) ? (原始分组 as 缓存分组) : "default";

    return {
        分组,
        原始键,
        表名: 缓存表映射[分组],
    };
}

async function 统计缓存条目数量(): Promise<number> {
    const 缓存服务 = 获取缓存服务();
    if (!缓存服务) return 0;

    // 优化：使用 Promise.all 并发统计各个表的数量
    const 统计任务 = 已知缓存分组.map(async (分组) => {
        let 数量 = 0;
        for await (const _ of 缓存服务.keys(缓存表映射[分组])) {
            数量++;
        }
        return 数量;
    });

    const 结果 = await Promise.all(统计任务);
    return 结果.reduce((总和, 当前值) => 总和 + 当前值, 0);
}

export function 初始化统一缓存配置(ctx: Context, 配置: Partial<统一缓存配置>) {
    当前上下文 = ctx;
    当前配置 = {
        ...默认缓存配置,
        ...配置,
    };
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

export async function 按前缀删除缓存(prefix: string): Promise<number> {
    const 输入前缀 = prefix.trim();
    const 缓存服务 = 获取缓存服务();
    if (!输入前缀 || !缓存服务) return 0;

    // 优化：使用 Promise.all 并发处理不同表的删除任务
    const 删除任务 = 已知缓存分组.map(async (分组) => {
        let count = 0;
        const 表名 = 缓存表映射[分组];

        for await (const 原始键 of 缓存服务.keys(表名)) {
            const 完整键 = 构造缓存键(分组, 原始键);
            if (完整键.startsWith(输入前缀)) {
                await 缓存服务.delete(表名, 原始键);
                count++;
            }
        }
        return count;
    });

    const 结果 = await Promise.all(删除任务);
    return 结果.reduce((总和, 当前值) => 总和 + 当前值, 0);
}

export async function 清空缓存(): Promise<number> {
    const 缓存服务 = 获取缓存服务();
    if (!缓存服务) return 0;

    const 当前数量 = await 统计缓存条目数量();

    // 优化：并发清空所有表
    await Promise.all(已知缓存分组.map(分组 => 缓存服务.clear(缓存表映射[分组])));

    return 当前数量;
}

export async function 缓存获取或加载<T>(
    key: string,
    加载器: () => Promise<T>,
    ttl毫秒: number,
): Promise<T> {
    const 缓存服务 = 获取缓存服务();
    if (!当前配置.enabled || !缓存服务) {
        return 加载器();
    }

    const { 原始键, 表名 } = 解析缓存键(key);

    const 命中 = (await 缓存服务.get(表名, 原始键)) as T | undefined;
    if (命中 !== undefined) {
        return 命中;
    }

    if (进行中表.has(key)) {
        return 进行中表.get(key) as Promise<T>;
    }

    // 优化：将清理进行中表的逻辑封装在 Promise 内部
    const 任务 = (async () => {
        try {
            const 数据 = await 加载器();
            await 缓存服务.set(表名, 原始键, 数据, Math.max(1, ttl毫秒));
            return 数据;
        } finally {
            // 无论加载成功还是抛出异常，都在结束后移除标记
            进行中表.delete(key);
        }
    })();

    进行中表.set(key, 任务);

    return 任务;
}

export async function 获取缓存概览(): Promise<缓存概览> {
    return {
        enabled: 当前配置.enabled,
        size: await 统计缓存条目数量(),
    };
}
