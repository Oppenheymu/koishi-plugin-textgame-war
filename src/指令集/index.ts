import { Context } from "koishi";
import { 生产指令 } from "./生产指令/index";
import { 基础指令 } from "./基础指令";
import { 战争指令 } from "./战争指令";

const 生产插件列表 = [基础指令, 生产指令, 战争指令];

export function 文游指令集(ctx: Context) {
    for (const 插件 of 生产插件列表) {
        ctx.plugin(插件);
    }
}
