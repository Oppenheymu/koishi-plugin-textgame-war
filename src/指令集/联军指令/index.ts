import { Context } from "koishi";

import { 组建联军 } from "./组建联军";
import { 邀请加入联军 } from "./邀请加入联军";
import { 查询相关指令 } from "./查询相关";
import { 批量加载插件 } from "../../utils/插件加载器";

const 联军插件列表 = [组建联军, 邀请加入联军, ...查询相关指令];

// 统一挂载所有联军相关指令
export function 联军指令(ctx: Context) {
    批量加载插件(ctx, 联军插件列表, "联军指令模块");
}
