import { CoalitionArmy } from "../../../types/index";

export function 获取联军展示名称(
    联军资料: Pick<CoalitionArmy, "联军名称" | "名称是否审核">
): string {
    return 联军资料.名称是否审核 ? 联军资料.联军名称 : "***";
}
