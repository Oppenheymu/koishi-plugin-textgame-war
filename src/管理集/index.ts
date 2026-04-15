import {
    Context
} from "koishi";

import {
    预设相关指令
} from "./预设相关";
import {
    稽查相关指令
} from "./稽查相关";
import {
    设置资源
} from "./设置资源";
import {
    信号塔调试
} from "./信号塔调试";
import {
    批量加载插件
} from "@/utils";

const 管理插件列表 = [设置资源, 信号塔调试, ...稽查相关指令, ...预设相关指令];

// 统一挂载所有管理相关服务
export function 文游管理集(ctx: Context) {
    批量加载插件(ctx, 管理插件列表, "文游管理集模块");
}
