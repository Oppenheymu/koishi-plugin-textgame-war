import { createCanvas } from "canvas";
import type { Context } from "koishi";
import type { Region, RegionTerra } from "#ctx/region";
import { GRID_HEIGHT, GRID_WIDTH } from "#ctx/region";
import { CELL_SIZE, MAP_HEIGHT, MAP_WIDTH } from "#ctx/world/application/mapgen/地图常量";

import { 创建势力配色器, 计算格子底色 } from "#ctx/world/application/mapgen/颜色计算";

export async function 渲染地图(
    ctx: Context,
    options?: { centerGridX: number; centerGridY: number; radius: number },
): Promise<Buffer | null> {
    try {
        const [地区列表, 地形列表] = await Promise.all([
            ctx.database.get("马列地区表", {}) as Promise<Region[]>,
            ctx.database.get("马列地区地形表", {}) as Promise<RegionTerra[]>,
        ]);

        if (地区列表.length === 0) {
            console.warn("[MapGenerator] 未读取到任何地区数据，终止生成。");
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

        const getOwnerColor = 创建势力配色器();

        if (options) {
            return 生成局部地图(options, 地区Map, 地形Map, getOwnerColor);
        }
        return 生成全尺寸地图(地区Map, 地形Map, getOwnerColor);
    } catch (error) {
        console.error("[MapGenerator] 生成地图图片时发生严重错误:", error);
        return null;
    }
}

function 生成全尺寸地图(
    地区Map: Map<string, Region>,
    地形Map: Map<string, RegionTerra>,
    getOwnerColor: (owner: string) => string,
): Buffer {
    const canvas = createCanvas(MAP_WIDTH, MAP_HEIGHT);
    const ctx2d = canvas.getContext("2d");

    ctx2d.fillStyle = "#0a1a3a";
    ctx2d.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    for (const [编号, 地形] of 地形Map) {
        const 地区 = 地区Map.get(编号);
        const 地形类型 = 地区?.地区地形 ?? "深海";
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

    ctx2d.strokeStyle = "rgba(255, 255, 255, 0.15)";
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

    ctx2d.strokeStyle = "rgba(255, 255, 255, 0.4)";
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

    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    ctx2d.font = "9px monospace";
    ctx2d.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (const [, 地区] of 地区Map) {
        const x = 地区.栅格X * CELL_SIZE + CELL_SIZE / 2;
        const y = 地区.栅格Y * CELL_SIZE + CELL_SIZE / 2;
        ctx2d.fillText(地区.地区编号, x, y);
    }

    return canvas.toBuffer("image/png");
}

function 生成局部地图(
    options: { centerGridX: number; centerGridY: number; radius: number },
    地区Map: Map<string, Region>,
    地形Map: Map<string, RegionTerra>,
    getOwnerColor: (owner: string) => string,
): Buffer {
    const { centerGridX, centerGridY, radius } = options;
    const gridW = radius * 2 + 1;
    const gridH = radius * 2 + 1;
    const canvasW = gridW * CELL_SIZE;
    const canvasH = gridH * CELL_SIZE;

    const canvas = createCanvas(canvasW, canvasH);
    const ctx2d = canvas.getContext("2d");

    ctx2d.fillStyle = "#0a1a3a";
    ctx2d.fillRect(0, 0, canvasW, canvasH);

    const srcX = centerGridX - radius;
    const srcY = centerGridY - radius;

    for (const [编号, 地形] of 地形Map) {
        const rx = 地形.栅格X - srcX;
        const ry = 地形.栅格Y - srcY;
        if (rx < 0 || rx >= gridW || ry < 0 || ry >= gridH) continue;

        const 地区 = 地区Map.get(编号);
        const 地形类型 = 地区?.地区地形 ?? "深海";
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

    ctx2d.strokeStyle = "rgba(255, 255, 255, 0.3)";
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

    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    ctx2d.font = "bold 12px monospace";
    ctx2d.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (const [, 地区] of 地区Map) {
        const rx = 地区.栅格X - srcX;
        const ry = 地区.栅格Y - srcY;
        if (rx < 0 || rx >= gridW || ry < 0 || ry >= gridH) continue;

        const px = rx * CELL_SIZE + CELL_SIZE / 2;
        const py = ry * CELL_SIZE + CELL_SIZE / 2;
        ctx2d.fillText(地区.地区编号, px, py - 7);

        ctx2d.font = "9px monospace";
        ctx2d.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx2d.fillText(地区.地区地形, px, py + 7);
        ctx2d.font = "bold 12px monospace";
        ctx2d.fillStyle = "rgba(255, 255, 255, 0.85)";
    }

    return canvas.toBuffer("image/png");
}
