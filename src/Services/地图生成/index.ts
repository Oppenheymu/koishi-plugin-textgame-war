import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createCanvas } from 'canvas';
import type { Context } from 'koishi';
import type { Region, RegionTerra } from '#/types';
import { GRID_HEIGHT, GRID_WIDTH } from '#/地理集';

const CELL_SIZE = 62;
const MAP_WIDTH = GRID_WIDTH * CELL_SIZE;
const MAP_HEIGHT = GRID_HEIGHT * CELL_SIZE;

const CACHE_DIR = path.resolve(__dirname, '../../../cache');
const FULL_MAP_CACHE = path.join(CACHE_DIR, 'full.png');
const LOCAL_MAP_TTL = 30 * 60 * 1000;

const TERRAIN_COLORS: Record<string, string> = {
    超深海: '#0a1a3a',
    深海: '#0d2b5e',
    中海: '#1a4a8a',
    浅海: '#2e6eb5',
    平原: '#7cb342',
    高原: '#a58c5a',
    浅丘: '#8d9e4e',
    深丘: '#6d7a3a',
    低山: '#5d6b3a',
    中山: '#4a5828',
    高山: '#6e6e6e',
};

const PHYSIO_COLORS: Record<string, string> = {
    水域: '#2e6eb5',
    雪地: '#e8eaf0',
    草地: '#8bc34a',
    荒地: '#c4a35a',
    森林: '#2e7d32',
    城镇: '#78909c',
};

const COALITION_PALETTE = [
    '#e53935',
    '#1e88e5',
    '#43a047',
    '#fb8c00',
    '#8e24aa',
    '#00acc1',
    '#f4511e',
    '#3949ab',
    '#7cb342',
    '#c0ca33',
    '#ff7043',
    '#5c6bc0',
    '#26a69a',
    '#ef5350',
    '#42a5f5',
    '#66bb6a',
    '#ffa726',
    '#ab47bc',
    '#26c6da',
    '#ec407a',
];

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function blendColors(colors: { color: string; weight: number }[]): string {
    let totalWeight = 0;
    let r = 0,
        g = 0,
        b = 0;
    for (const { color, weight } of colors) {
        const [cr, cg, cb] = hexToRgb(color);
        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0) return '#333333';
    return rgbToHex(
        Math.round(r / totalWeight),
        Math.round(g / totalWeight),
        Math.round(b / totalWeight)
    );
}

function 计算格子底色(地形: string, 地貌: RegionTerra): string {
    if (地貌.是否为海洋) {
        return TERRAIN_COLORS[地形] ?? '#1a4a8a';
    }

    const entries: { color: string; weight: number }[] = [];
    if (地貌.森林 > 0) entries.push({ color: PHYSIO_COLORS.森林, weight: 地貌.森林 });
    if (地貌.草地 > 0) entries.push({ color: PHYSIO_COLORS.草地, weight: 地貌.草地 });
    if (地貌.荒地 > 0) entries.push({ color: PHYSIO_COLORS.荒地, weight: 地貌.荒地 });
    if (地貌.雪地 > 0) entries.push({ color: PHYSIO_COLORS.雪地, weight: 地貌.雪地 });
    if (地貌.城镇 > 0) entries.push({ color: PHYSIO_COLORS.城镇, weight: 地貌.城镇 });
    if (地貌.水域 > 0) entries.push({ color: PHYSIO_COLORS.水域, weight: 地貌.水域 });

    if (entries.length === 0) {
        return TERRAIN_COLORS[地形] ?? '#7cb342';
    }

    const baseColor = blendColors(entries);

    const terrainTint = TERRAIN_COLORS[地形] ?? '#7cb342';
    const [br, bg, bb] = hexToRgb(baseColor);
    const [tr, tg, tb] = hexToRgb(terrainTint);
    const tintStrength = 0.25;
    return rgbToHex(
        Math.round(br * (1 - tintStrength) + tr * tintStrength),
        Math.round(bg * (1 - tintStrength) + tg * tintStrength),
        Math.round(bb * (1 - tintStrength) + tb * tintStrength)
    );
}

export async function GenerateMap(
    ctx: Context,
    options?: { centerGridX: number; centerGridY: number; radius: number }
): Promise<Buffer | null> {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    if (!options) {
        const cached = await readCache(FULL_MAP_CACHE);
        if (cached) return cached;
        const buffer = await renderMap(ctx, undefined);
        if (buffer) await writeCache(FULL_MAP_CACHE, buffer);
        return buffer;
    }

    const cacheKey = `local_${options.centerGridX}_${options.centerGridY}_${options.radius}.png`;
    const cachePath = path.join(CACHE_DIR, cacheKey);
    const cached = await readCache(cachePath, LOCAL_MAP_TTL);
    if (cached) return cached;

    const buffer = await renderMap(ctx, options);
    if (buffer) await writeCache(cachePath, buffer);
    return buffer;
}

async function readCache(filePath: string, ttl?: number): Promise<Buffer | null> {
    try {
        const stat = await fs.stat(filePath);
        if (ttl && Date.now() - stat.mtimeMs > ttl) return null;
        return await fs.readFile(filePath);
    } catch {
        return null;
    }
}

async function writeCache(filePath: string, buffer: Buffer): Promise<void> {
    try {
        await fs.writeFile(filePath, buffer);
    } catch (error) {
        console.error(`[MapGenerator] 写入缓存失败 ${filePath}:`, error);
    }
}

async function renderMap(
    ctx: Context,
    options?: { centerGridX: number; centerGridY: number; radius: number }
): Promise<Buffer | null> {
    try {
        const [地区列表, 地形列表] = await Promise.all([
            ctx.database.get('马列地区表', {}) as Promise<Region[]>,
            ctx.database.get('马列地区地形表', {}) as Promise<RegionTerra[]>,
        ]);

        if (地区列表.length === 0) {
            console.warn('[MapGenerator] 未读取到任何地区数据，终止生成。');
            return null;
        }

        const 地形Map = new Map<string, RegionTerra>();
        for (const t of 地形列表) {
            地形Map.set(t.地区编号, t);
        }

        const 地区Map = new Map<string, Region>();
        for (const r of 地区列表) {
            地区Map.set(r.地区编号, r);
        }

        const ownerColorMap = new Map<string, string>();
        let colorIndex = 0;
        const getOwnerColor = (owner: string) => {
            if (!ownerColorMap.has(owner)) {
                ownerColorMap.set(owner, COALITION_PALETTE[colorIndex % COALITION_PALETTE.length]);
                colorIndex++;
            }
            return ownerColorMap.get(owner) as string;
        };

        if (options) {
            return generateLocalMap(options, 地区Map, 地形Map, getOwnerColor);
        }
        return generateFullMap(地区Map, 地形Map, getOwnerColor);
    } catch (error) {
        console.error('[MapGenerator] 生成地图图片时发生严重错误:', error);
        return null;
    }
}

function generateFullMap(
    地区Map: Map<string, Region>,
    地形Map: Map<string, RegionTerra>,
    getOwnerColor: (owner: string) => string
): Buffer {
    const canvas = createCanvas(MAP_WIDTH, MAP_HEIGHT);
    const ctx2d = canvas.getContext('2d');

    ctx2d.fillStyle = '#0a1a3a';
    ctx2d.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    for (const [编号, 地形] of 地形Map) {
        const 地区 = 地区Map.get(编号);
        const 地形类型 = 地区?.地区地形 ?? '深海';
        const color = 计算格子底色(地形类型, 地形);
        const x = 地形.栅格X * CELL_SIZE;
        const y = 地形.栅格Y * CELL_SIZE;
        ctx2d.fillStyle = color;
        ctx2d.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }

    ctx2d.globalAlpha = 0.4;
    for (const [, 地区] of 地区Map) {
        if (!地区.控制国家?.trim()) continue;
        const x = 地区.栅格X * CELL_SIZE;
        const y = 地区.栅格Y * CELL_SIZE;
        ctx2d.fillStyle = getOwnerColor(地区.控制国家);
        ctx2d.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }
    ctx2d.globalAlpha = 1.0;

    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx2d.lineWidth = 0.5;
    for (let gx = 0; gx <= GRID_WIDTH; gx++) {
        const x = gx * CELL_SIZE;
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, MAP_HEIGHT);
        ctx2d.stroke();
    }
    for (let gy = 0; gy <= GRID_HEIGHT; gy++) {
        const y = gy * CELL_SIZE;
        ctx2d.beginPath();
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(MAP_WIDTH, y);
        ctx2d.stroke();
    }

    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx2d.lineWidth = 1;
    for (let gx = 0; gx <= GRID_WIDTH; gx += 10) {
        const x = gx * CELL_SIZE;
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, MAP_HEIGHT);
        ctx2d.stroke();
    }
    for (let gy = 0; gy <= GRID_HEIGHT; gy += 10) {
        const y = gy * CELL_SIZE;
        ctx2d.beginPath();
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(MAP_WIDTH, y);
        ctx2d.stroke();
    }

    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.font = '9px monospace';
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (const [, 地区] of 地区Map) {
        const x = 地区.栅格X * CELL_SIZE + CELL_SIZE / 2;
        const y = 地区.栅格Y * CELL_SIZE + CELL_SIZE / 2;
        ctx2d.fillText(地区.地区编号, x, y);
    }

    return canvas.toBuffer('image/png');
}

function generateLocalMap(
    options: { centerGridX: number; centerGridY: number; radius: number },
    地区Map: Map<string, Region>,
    地形Map: Map<string, RegionTerra>,
    getOwnerColor: (owner: string) => string
): Buffer {
    const { centerGridX, centerGridY, radius } = options;
    const gridW = radius * 2 + 1;
    const gridH = radius * 2 + 1;
    const canvasW = gridW * CELL_SIZE;
    const canvasH = gridH * CELL_SIZE;

    const canvas = createCanvas(canvasW, canvasH);
    const ctx2d = canvas.getContext('2d');

    ctx2d.fillStyle = '#0a1a3a';
    ctx2d.fillRect(0, 0, canvasW, canvasH);

    const srcX = centerGridX - radius;
    const srcY = centerGridY - radius;

    for (const [编号, 地形] of 地形Map) {
        const rx = 地形.栅格X - srcX;
        const ry = 地形.栅格Y - srcY;
        if (rx < 0 || rx >= gridW || ry < 0 || ry >= gridH) continue;

        const 地区 = 地区Map.get(编号);
        const 地形类型 = 地区?.地区地形 ?? '深海';
        const color = 计算格子底色(地形类型, 地形);
        ctx2d.fillStyle = color;
        ctx2d.fillRect(rx * CELL_SIZE, ry * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    ctx2d.globalAlpha = 0.4;
    for (const [, 地区] of 地区Map) {
        const rx = 地区.栅格X - srcX;
        const ry = 地区.栅格Y - srcY;
        if (rx < 0 || rx >= gridW || ry < 0 || ry >= gridH) continue;
        if (!地区.控制国家?.trim()) continue;

        ctx2d.fillStyle = getOwnerColor(地区.控制国家);
        ctx2d.fillRect(rx * CELL_SIZE, ry * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    ctx2d.globalAlpha = 1.0;

    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx2d.lineWidth = 0.5;
    for (let i = 0; i <= gridW; i++) {
        ctx2d.beginPath();
        ctx2d.moveTo(i * CELL_SIZE, 0);
        ctx2d.lineTo(i * CELL_SIZE, canvasH);
        ctx2d.stroke();
    }
    for (let i = 0; i <= gridH; i++) {
        ctx2d.beginPath();
        ctx2d.moveTo(0, i * CELL_SIZE);
        ctx2d.lineTo(canvasW, i * CELL_SIZE);
        ctx2d.stroke();
    }

    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.font = 'bold 12px monospace';
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const [, 地区] of 地区Map) {
        const rx = 地区.栅格X - srcX;
        const ry = 地区.栅格Y - srcY;
        if (rx < 0 || rx >= gridW || ry < 0 || ry >= gridH) continue;

        const px = rx * CELL_SIZE + CELL_SIZE / 2;
        const py = ry * CELL_SIZE + CELL_SIZE / 2;
        ctx2d.fillText(地区.地区编号, px, py - 7);

        ctx2d.font = '9px monospace';
        ctx2d.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx2d.fillText(地区.地区地形, px, py + 7);
        ctx2d.font = 'bold 12px monospace';
        ctx2d.fillStyle = 'rgba(255, 255, 255, 0.85)';
    }

    return canvas.toBuffer('image/png');
}

export function 地图生成调度(ctx: Context) {
    ctx.cron('0 * * * *', async () => {
        console.info('[MapGenerator] 定时任务：生成全尺寸世界地图...');
        const buffer = await GenerateMap(ctx);
        if (buffer) {
            console.info('[MapGenerator] 世界地图已生成并缓存。');
        } else {
            console.error('[MapGenerator] 定时任务未能生成地图图片。');
        }
    });

    ctx.cron('0 */10 * * * *', async () => {
        await cleanExpiredCache();
    });

    ctx.command('生成世界地图', { authority: 4 })
        .alias('生成地图')
        .action(async () => {
            console.info('[MapGenerator] 手动生成世界地图...');
            const buffer = await GenerateMap(ctx);
            if (buffer) {
                return '世界地图已生成并缓存。';
            }
            return '生成地图失败，请检查后台日志。';
        });
}

async function cleanExpiredCache(): Promise<void> {
    try {
        const files = await fs.readdir(CACHE_DIR);
        const now = Date.now();
        for (const file of files) {
            if (!file.startsWith('local_') || !file.endsWith('.png')) continue;
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

export const 地图生成服务列表 = [地图生成调度];
