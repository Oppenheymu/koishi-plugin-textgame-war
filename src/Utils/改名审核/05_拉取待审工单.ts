import { 改名工单池 } from "./state";
import { 改名审核工单 } from "./types";

export function 获取待审核工单(工单编号: number): 改名审核工单 {
    const 工单 = 改名工单池.get(工单编号);
    if (!工单) {
        throw new Error(`未找到改名工单 #${工单编号}`);
    }
    if (工单.状态 !== "待审核") {
        throw new Error(`改名工单 #${工单编号} 已处理（${工单.状态}）`);
    }
    return 工单;
}
