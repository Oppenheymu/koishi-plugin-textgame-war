
import { Context } from "koishi";

import { 组建联军 } from "./组建联军";

const 联军插件列表 = [ 组建联军 ];

// 统一挂载所有数据库相关服务
export function 文游管理集(ctx: Context) {
    for (const 插件 of 联军插件列表) {
        ctx.plugin(插件);
    }
}
