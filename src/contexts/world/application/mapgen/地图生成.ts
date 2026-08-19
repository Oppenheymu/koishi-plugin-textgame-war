import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Context } from "koishi";
import { 渲染地图 } from "#ctx/world/application/mapgen/地图渲染";

import {
    CACHE_DIR,
    FULL_MAP_CACHE,
    LOCAL_MAP_TTL,
    写入缓存,
    读取缓存,
} from "#ctx/world/application/mapgen/缓存管理";

export async function GenerateMap(
    ctx: Context,
    options?: { centerGridX: number; centerGridY: number; radius: number },
): Promise<Buffer | null> {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    if (!options) {
        const cached = await 读取缓存(FULL_MAP_CACHE);
        if (cached) return cached;
        const buffer = await 渲染地图(ctx, undefined);
        if (buffer) await 写入缓存(FULL_MAP_CACHE, buffer);
        return buffer;
    }

    const cacheKey = `local_${options.centerGridX}_${options.centerGridY}_${options.radius}.png`;
    const cachePath = path.join(CACHE_DIR, cacheKey);
    const cached = await 读取缓存(cachePath, LOCAL_MAP_TTL);
    if (cached) return cached;

    const buffer = await 渲染地图(ctx, options);
    if (buffer) await 写入缓存(cachePath, buffer);
    return buffer;
}
