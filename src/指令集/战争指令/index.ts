import { Context } from "koishi";

import { 扩军 } from "./扩军"
import { 私人扩军 } from "./私人扩军";

export function 战争指令(ctx: Context) {
    扩军(ctx);
    私人扩军(ctx);
}
