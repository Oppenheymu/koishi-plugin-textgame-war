

export enum TerrainType {
	浅海 = "浅海",
	中海 = "中海",
	深海 = "深海",
	超深海 = "超深海",
	平原 = "平原",
	高原 = "高原",
	浅丘 = "浅丘",
	深丘 = "深丘",
	低山 = "低山",
	中山 = "中山",
	高山 = "高山",
}

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
