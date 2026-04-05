import { Context } from "koishi";
import { 生产指令 } from "./生产指令";
import { 联军指令 } from "./联军指令";
import { 基础指令 } from "./基础指令";
import { 战争指令 } from "./战争指令";
import { 批量加载插件 } from "../utils/插件加载器";

const 生产插件列表 = [基础指令, 联军指令, 生产指令, 战争指令];

export function 文游指令集(ctx: Context) {
    批量加载插件(ctx, 生产插件列表, "文游指令集模块");
}
