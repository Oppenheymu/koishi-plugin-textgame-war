// 行军计算（详见 军事系统.prompt.md 第 5 章）

import type { Army, Region, RegionTerra } from "#/types";
import {
    TerrainType,
    两栖乘员占比要求,
    时间倍率,
    水域进入占比阈值,
    陆军装备属性表,
} from "#/types";
import { 切比雪夫网格距离, 计算真实距离 } from "#/地理集";
import { 解析地区编号 } from "#/地理集/坐标解析";
import { 计算地貌速度修正, 计算行军地形修正 } from "./战场宽度";

const 海洋地形列表: TerrainType[] = [
    TerrainType.浅海,
    TerrainType.中海,
    TerrainType.深海,
    TerrainType.超深海,
];

/** 进军校验（5.1）：返回 null 表示可通行，否则返回拒绝原因 */
export function 校验进军目标(参数: {
    军队: Pick<Army, "列车炮" | "两栖坦克" | "两栖装甲运兵车" | "士兵数量">;
    出发地区: Pick<Region, "地区编号" | "栅格X" | "栅格Y" | "地区地形">;
    目标地区: Pick<Region, "地区编号" | "栅格X" | "栅格Y" | "地区地形">;
    目标地貌: Pick<RegionTerra, "水域">;
}): string | null {
    const { 军队, 出发地区, 目标地区, 目标地貌 } = 参数;

    // 1. 相邻校验（切比雪夫网格距离 = 1）
    const 坐标A = 解析地区编号(出发地区.地区编号);
    const 坐标B = 解析地区编号(目标地区.地区编号);
    if (切比雪夫网格距离(坐标A, 坐标B) !== 1) {
        return "目标地区不与所在地区相邻，无法进军";
    }

    // 2. 海洋不可进入
    if (海洋地形列表.includes(目标地区.地区地形)) {
        return "目标地区为海洋，陆军无法进入";
        // TODO(第三阶段): 登陆战——两栖装备主导的跨海进军
    }

    // 3. 高水域占比需要两栖装备（乘员占比 ≥ 30%）
    if (目标地貌.水域 > 水域进入占比阈值) {
        const 两栖乘员 =
            军队.两栖坦克 * 陆军装备属性表.两栖坦克.乘员数 +
            军队.两栖装甲运兵车 * 陆军装备属性表.两栖装甲运兵车.乘员数;
        const 占比 = 军队.士兵数量 > 0 ? 两栖乘员 / 军队.士兵数量 : 0;
        if (占比 < 两栖乘员占比要求) {
            return `目标地区水域占比过高（${(目标地貌.水域 * 100).toFixed(0)}%），需要两栖装备乘员占比 ≥ ${两栖乘员占比要求 * 100}%（当前 ${(占比 * 100).toFixed(1)}%）`;
        }
    }

    // 4. 列车炮需铁路（铁路系统未落地，第一阶段放行）
    // TODO(第二阶段): 携带列车炮时校验目标路径有铁路，见 军事系统.prompt.md 3.1 特殊规则

    return null;
}

/**
 * 计算行军所需现实毫秒数（5.2）
 * 路程(haversine) ÷ 修正速度 = 游戏内小时；再按时间倍率折算现实时长
 */
export function 计算行军毫秒数(参数: {
    基础速度: number; // 面板速度 km/h
    出发地区编号: string;
    目标地区编号: string;
    出发地形: TerrainType;
    目标地形: TerrainType;
    目标地貌: Pick<
        RegionTerra,
        "水域" | "雪地" | "草地" | "荒地" | "森林" | "城镇"
    >;
}): number {
    const {
        基础速度,
        出发地区编号,
        目标地区编号,
        出发地形,
        目标地形,
        目标地貌,
    } = 参数;

    const 路程 = 计算真实距离(出发地区编号, 目标地区编号); // km
    const 地形修正 = 计算行军地形修正(出发地形, 目标地形);
    const 地貌修正 = 计算地貌速度修正(目标地貌);
    const 修正速度 = 基础速度 * 地形修正 * 地貌修正;

    if (修正速度 <= 0) {
        throw new Error("修正速度为 0，无法行军（请检查地形地貌修正配置）");
    }

    const 游戏小时 = 路程 / 修正速度;
    const 现实分钟 = (游戏小时 * 60) / 时间倍率;
    return 现实分钟 * 60 * 1000;
}

/** 撤退目的地选择（6.7）：相邻友方地区（优先本国控制，其次无主地区） */
export function 选择撤退目的地(参数: {
    当前地区编号: string;
    所属联军编号: string;
    相邻地区列表: Pick<Region, "地区编号" | "地区地形" | "控制国家">[];
}): string | null {
    const { 所属联军编号, 相邻地区列表 } = 参数;
    const 陆地相邻 = 相邻地区列表.filter(
        (地区) => !海洋地形列表.includes(地区.地区地形),
    );

    const 本国控制 = 陆地相邻.filter((地区) => 地区.控制国家 === 所属联军编号);
    if (本国控制.length > 0) {
        return 本国控制[Math.floor(Math.random() * 本国控制.length)].地区编号;
    }

    const 无主地区 = 陆地相邻.filter((地区) => !地区.控制国家);
    if (无主地区.length > 0) {
        return 无主地区[Math.floor(Math.random() * 无主地区.length)].地区编号;
    }

    return null; // 无路可退 → 歼灭
}
