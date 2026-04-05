import { Context } from "koishi";

import { 改名相关指令 } from "./改名相关";
import { 跨端相关指令 } from "./跨端相关";

import { 查看版本日志 } from "./查看版本日志";

const 基础指令列表 = [查看版本日志, ...改名相关指令, ...跨端相关指令];

export function 基础指令(ctx: Context) {
    for (const 插件 of 基础指令列表) {
        ctx.plugin(插件);
    }
}
