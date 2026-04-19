import type { 经纬度, 栅格坐标 } from './坐标解析';
import { 解析地区编号, 栅格转经纬度, GRID_WIDTH } from './坐标解析';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export function haversineDistance(a: 经纬度, b: 经纬度): number {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h =
        sinDLat * sinDLat +
        Math.cos(toRadians(a.latitude)) *
        Math.cos(toRadians(b.latitude)) *
        sinDLon * sinDLon;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function 计算真实距离(地区编号A: string, 地区编号B: string): number {
    const 坐标A = 解析地区编号(地区编号A);
    const 坐标B = 解析地区编号(地区编号B);
    const 位置A = 栅格转经纬度(坐标A);
    const 位置B = 栅格转经纬度(坐标B);
    return haversineDistance(位置A, 位置B);
}

export function 计算栅格经纬度距离(坐标A: 栅格坐标, 坐标B: 栅格坐标): number {
    return haversineDistance(栅格转经纬度(坐标A), 栅格转经纬度(坐标B));
}

export function 切比雪夫网格距离(坐标A: 栅格坐标, 坐标B: 栅格坐标): number {
    return Math.max(Math.abs(坐标A.gridX - 坐标B.gridX), Math.abs(坐标A.gridY - 坐标B.gridY));
}

export function 曼哈顿网格距离(坐标A: 栅格坐标, 坐标B: 栅格坐标): number {
    return Math.abs(坐标A.gridX - 坐标B.gridX) + Math.abs(坐标A.gridY - 坐标B.gridY);
}

export function 格式化距离(公里数: number): string {
    if (公里数 >= 10000) return `${(公里数 / 1000).toFixed(0)}k km`;
    if (公里数 >= 1000) return `${(公里数 / 1000).toFixed(1)}k km`;
    return `${公里数.toFixed(0)} km`;
}

export function 是否跨日期变更线(坐标A: 栅格坐标, 坐标B: 栅格坐标): boolean {
    return Math.abs(坐标A.gridX - 坐标B.gridX) > GRID_WIDTH / 2;
}

export function 计算最短经度差(经度A: number, 经度B: number): number {
    let diff = 经度B - 经度A;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
}

export function 计算方向(起点: 栅格坐标, 终点: 栅格坐标): string {
    let dx = 终点.gridX - 起点.gridX;
    const dy = 终点.gridY - 起点.gridY;
    if (dx > GRID_WIDTH / 2) dx -= GRID_WIDTH;
    if (dx < -GRID_WIDTH / 2) dx += GRID_WIDTH;

    const directions: string[] = [];
    if (dy < 0) directions.push('北');
    if (dy > 0) directions.push('南');
    if (dx > 0) directions.push('东');
    if (dx < 0) directions.push('西');

    return directions.join('') || '原地';
}
