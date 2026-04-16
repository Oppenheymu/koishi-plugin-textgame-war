export type RegionPermissionLevel = 0 | 1 | 2 | 3 | 4;

export interface RegionPermission {
    地区编号: string;

    地区驻扎权限: boolean;
}
