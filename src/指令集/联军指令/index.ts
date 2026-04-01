import { Context } from "koishi";

import { 组建联军 } from "./组建联军";
import { 他的联军 } from "./查询相关/他的联军";
import { 我的联军 } from "./查询相关/我的联军";

const 联军插件列表 = [组建联军, 我的联军, 他的联军];

// 统一挂载所有数据库相关服务
export function 联军指令(ctx: Context) {
    for (const 插件 of 联军插件列表) {
        ctx.plugin(插件);
    }
}
