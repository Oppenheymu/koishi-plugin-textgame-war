import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const CACHE_DIR = fileURLToPath(new URL("../../../cache", import.meta.url));
export const FULL_MAP_CACHE = path.join(CACHE_DIR, "full.png");
export const LOCAL_MAP_TTL = 30 * 60 * 1000;

export async function 读取缓存(filePath: string, ttl?: number): Promise<Buffer | null> {
    try {
        const stat = await fs.stat(filePath);
        if (ttl && Date.now() - stat.mtimeMs > ttl) return null;
        return await fs.readFile(filePath);
    } catch {
        return null;
    }
}

export async function 写入缓存(filePath: string, buffer: Buffer): Promise<void> {
    try {
        await fs.writeFile(filePath, buffer);
    } catch (error) {
        console.error(`[MapGenerator] 写入缓存失败 ${filePath}:`, error);
    }
}

export async function 清理过期缓存(): Promise<void> {
    try {
        const files = await fs.readdir(CACHE_DIR);
        const now = Date.now();
        for (const file of files) {
            if (!file.startsWith("local_") || !file.endsWith(".png")) continue;
            const filePath = path.join(CACHE_DIR, file);
            const stat = await fs.stat(filePath);
            if (now - stat.mtimeMs > LOCAL_MAP_TTL) {
                await fs.unlink(filePath);
            }
        }
    } catch {
        // ignore
    }
}
