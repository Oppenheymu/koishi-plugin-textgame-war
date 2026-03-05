
import { Context } from "koishi";
import { 我的UID } from "./我的UID";
import { 绑定账户 } from "./绑定账户"



export function 基础指令(ctx: Context) {

    我的UID(ctx);
    绑定账户(ctx);

}
