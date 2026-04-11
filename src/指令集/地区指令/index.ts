import {
    Context
} from "koishi";
import {
    批量加载插件
} from "../../utils/插件加载";

import {
    查询相关指令
} from "./查询相关";

const 地区指令列表 = [...查询相关指令];

export function 地区指令(ctx: Context) {
    批量加载插件(ctx, 地区指令列表, "地区指令模块");
}