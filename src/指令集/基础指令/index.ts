
import { Context } from "koishi";
import { 我的UID } from "./我的UID";
import { 我的账户配置 } from "./我的配置"
import { 绑定账户 } from "./绑定账户"



export function 基础指令(ctx: Context) {

    我的UID(ctx);
    我的账户配置(ctx)
    绑定账户(ctx);

}
