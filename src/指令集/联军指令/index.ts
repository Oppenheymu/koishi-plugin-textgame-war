import { Context } from "koishi";

import { 组建联军 } from "./组建联军";
import { 查询相关指令 } from "./查询相关";

const 联军插件列表 = [组建联军, ...查询相关指令];

// 统一挂载所有数据库相关服务
export function 联军指令(ctx: Context) {
    for (const 插件 of 联军插件列表) {
        ctx.plugin(插件);
    }
}
