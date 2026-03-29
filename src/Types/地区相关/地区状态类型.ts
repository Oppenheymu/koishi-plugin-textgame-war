export interface RegionState {
    地区编号: string;

    // 这里的归属国ID用的是混淆前的自增ID
    地区归属国: number
    是否已分配: boolean;
}

export interface RegionShufflePool {
    id: number;
    地区编号: string;
}
