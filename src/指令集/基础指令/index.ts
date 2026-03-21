
import { Context } from "koishi";

import { 加载跨平台} from "./跨平台/";
import { 查看版本日志 } from "./查看版本日志";



const 基础指令列表 = [
    查看版本日志,
    ...加载跨平台,
];

export function 基础指令(ctx: Context) {
    for (const 插件 of 基础指令列表 ) {
        ctx.plugin(插件)
    }
}
