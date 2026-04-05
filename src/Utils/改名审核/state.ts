import { 改名审核工单 } from "./types";

export const 审核群号 = "1049772130";
export const 改名工单池 = new Map<number, 改名审核工单>();
let 工单自增ID = 1;

export function 获取下一个工单编号(): number {
    return 工单自增ID++;
}
