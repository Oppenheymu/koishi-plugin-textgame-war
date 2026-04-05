import { RegionConfig } from "../../Types/index";

export function 获取地区展示名称(
    地区配置资料: Pick<RegionConfig, "地区名称" | "名称是否审核">,
): string {
    return 地区配置资料.名称是否审核 ? 地区配置资料.地区名称 : "***";
}
