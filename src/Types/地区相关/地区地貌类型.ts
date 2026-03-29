export enum PhysiognomyType {
    Water = "水域", // 总水域
    Snow = "雪地", // 雪原
    Grassland = "草地", // 草原
    Bareland = "荒地", // 荒地/裸地
    Forest = "森林", // 森林
    Urban = "城镇", // 城镇
}

export interface RegionTerra {
    地区编号: string;

    是否为海洋: boolean;

    // 地区地形
    平均海拔: number;
    最大海拔: number;
    最小海拔: number;
    地区崎岖度: number;

    // 地区地貌
    水域: number;
    雪地: number;
    草地: number;
    荒地: number;
    森林: number;
    城镇: number;
}

// RegionBasicData.json 原始结构（仅保留业务使用字段）
export interface RegionBasicDataItem {
    RegionId: string;
    isOcean: boolean;
    MeanElevation: number;
    STDElevation: number;
    MaxElevation: number;
    MinElevation: number;
    Water: number;
    Snow: number;
    Grassland: number;
    Bareland: number;
    Forest: number;
    Urban: number;
}

export interface CapacityLimit {
    基础设施上限: number;
    公路容量上限: number;
    机场容量上限: number;
    港口容量上限: number;
    居民区容量上限: number;
    仓库容量上限: number;
}

export interface CapacityBase {
    基础设施: number;
    公路: number;
    机场: number;
    港口: number;
    居民区: number;
    仓库: number;
}
