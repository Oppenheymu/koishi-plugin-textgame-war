export interface 经纬度 {
    longitude: number;
    latitude: number;
}

export interface 栅格坐标 {
    gridX: number;
    gridY: number;
}

export const GRID_WIDTH = 160;
export const GRID_HEIGHT = 80;
export const TOTAL_REGIONS = GRID_WIDTH * GRID_HEIGHT;

const DEG_PER_CELL_X = 360 / GRID_WIDTH;
const DEG_PER_CELL_Y = 180 / GRID_HEIGHT;

export function 解析地区编号(地区编号: string): 栅格坐标 {
    const num = parseInt(地区编号, 10);
    if (Number.isNaN(num) || num < 0 || num >= TOTAL_REGIONS) {
        throw new Error(`无效的地区编号：${地区编号}`);
    }
    const gridX = Math.floor(num / 100);
    const gridY = num % 100;
    if (gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT) {
        throw new Error(`无效的地区编号：${地区编号}`);
    }
    return { gridX, gridY };
}

export function 栅格坐标转地区编号(坐标: 栅格坐标): string {
    const { gridX, gridY } = 坐标;
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
        throw new Error(`无效的栅格坐标：(${gridX}, ${gridY})`);
    }
    return String(gridX * 100 + gridY).padStart(5, '0');
}

export function 栅格转经纬度(坐标: 栅格坐标): 经纬度 {
    const { gridX, gridY } = 坐标;
    return {
        longitude: -180 + gridX * DEG_PER_CELL_X + DEG_PER_CELL_X / 2,
        latitude: 90 - gridY * DEG_PER_CELL_Y - DEG_PER_CELL_Y / 2,
    };
}

export function 经纬度转栅格(位置: 经纬度): 栅格坐标 {
    let { longitude, latitude } = 位置;
    if (longitude > 180) longitude -= 360;
    if (longitude < -180) longitude += 360;
    latitude = Math.max(-90, Math.min(90, latitude));
    const gridX = Math.floor((longitude + 180) / DEG_PER_CELL_X);
    const gridY = Math.floor((90 - latitude) / DEG_PER_CELL_Y);
    return {
        gridX: Math.max(0, Math.min(GRID_WIDTH - 1, gridX)),
        gridY: Math.max(0, Math.min(GRID_HEIGHT - 1, gridY)),
    };
}

export function 地区编号转经纬度(地区编号: string): 经纬度 {
    return 栅格转经纬度(解析地区编号(地区编号));
}

export interface 栅格边长 {
    东西宽度公里: number;
    南北高度公里: number;
    面积平方公里: number;
}

const EARTH_RADIUS_KM = 6371;

export function 计算栅格边长(坐标: 栅格坐标): 栅格边长 {
    const { gridY } = 坐标;
    const centerLat = 90 - gridY * DEG_PER_CELL_Y - DEG_PER_CELL_Y / 2;
    const latRad = centerLat * (Math.PI / 180);

    const 南北高度公里 = DEG_PER_CELL_Y * (Math.PI / 180) * EARTH_RADIUS_KM;
    const 东西宽度公里 =
        DEG_PER_CELL_X * (Math.PI / 180) * EARTH_RADIUS_KM * Math.cos(latRad);

    return {
        东西宽度公里,
        南北高度公里,
        面积平方公里: 东西宽度公里 * 南北高度公里,
    };
}

export function 计算地区编号边长(地区编号: string): 栅格边长 {
    return 计算栅格边长(解析地区编号(地区编号));
}

export function 格式化经纬度(位置: 经纬度): string {
    const latDir = 位置.latitude >= 0 ? 'N' : 'S';
    const lonDir = 位置.longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(位置.latitude).toFixed(2)}°${latDir}, ${Math.abs(位置.longitude).toFixed(2)}°${lonDir}`;
}
