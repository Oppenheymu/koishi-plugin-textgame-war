// 地区地貌

export enum TerrainType {
    浅海 = '浅海',
    中海 = '中海',
    深海 = '深海',
    超深海 = '超深海',
    平原 = '平原',
    高原 = '高原',
    浅丘 = '浅丘',
    深丘 = '深丘',
    低山 = '低山',
    中山 = '中山',
    高山 = '高山',
}

export interface Region {
    地区编号: string;

    地区地形: TerrainType;

    控制国家: string;

    地区总督: string;
    允许非联军成员驻扎: boolean;
    允许非联军成员使用机场: boolean;
    允许机场使用战斗机: boolean;

    // 基础设施
    当前总基础设施: number;
    使用的基础设施: number;
    基础设施上限: number;

    当前总公路容量: number;
    使用的公路容量: number;
    公路容量上限: number;

    当前总机场容量: number;
    使用的机场容量: number;
    机场容量上限: number;

    当前总港口容量: number;
    使用的港口容量: number;
    港口容量上限: number;

    当前总居民区容量: number;
    使用的居民区容量: number;
    居民区容量上限: number;

    当前总仓库容量: number;
    使用的仓库容量: number;
    仓库容量上限: number;

    电解铝厂数量: number;
    空闲的电解铝厂:number

    炼钢厂数量: number;
    空闲的炼钢厂: number;
}
