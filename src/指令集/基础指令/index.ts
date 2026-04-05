import { Context } from "koishi";

import { 加载跨平台 } from "./跨平台/";
import { 查看版本日志 } from "./查看版本日志";
import { 修改玩家名称 } from "./修改玩家名称";
import { 修改联军名称 } from "./修改联军名称";
import { 修改地区名称 } from "./修改地区名称";

const 基础指令列表 = [
    查看版本日志,
    修改玩家名称,
    修改联军名称,
    修改地区名称,
    ...加载跨平台,
];

export function 基础指令(ctx: Context) {
    for (const 插件 of 基础指令列表) {
        ctx.plugin(插件);
    }
}
