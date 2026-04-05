import { PlayerConfig } from "../../Types/index";

export function 获取玩家展示名称(
    玩家配置: Pick<PlayerConfig, "username" | "名称是否审核">,
): string {
    return 玩家配置.名称是否审核 ? 玩家配置.username : "默认名称";
}
