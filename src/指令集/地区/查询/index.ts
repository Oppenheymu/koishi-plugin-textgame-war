import { 查看地区地形 } from "./地区地形.js";
import { 查看地区工业 } from "./地区工业.js";
import { 地区战略相关 } from "./战略/index.js";
import { 查看地区 } from "./查看地区.js";
import { 查看距离 } from "./查看距离.js";
import { 查看附近地区 } from "./附近地区.js";

export const 查询相关指令 = [
    查看地区,
    查看地区工业,
    查看地区地形,
    查看附近地区,
    查看距离,
    ...地区战略相关,
];
