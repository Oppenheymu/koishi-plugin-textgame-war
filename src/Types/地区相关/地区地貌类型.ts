


export enum PhysiognomyType {
  Water = '水域',                  // 总水域
  Snow = '雪地',                   // 雪原
  Grassland = '草地',              // 草原
  Bareland = '荒地',               // 荒地/裸地
  Forest = '森林',                 // 森林
  Urban = '城镇',                  // 城镇
}

export interface RegionTerra {

    地区编号:string;

    是否为海洋: boolean;                // 是否为海洋

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
