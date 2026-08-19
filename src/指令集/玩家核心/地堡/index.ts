import { 修建地堡 } from "./修建地堡.js";
import { 地堡查询相关 } from "./地堡查询/index.js";
import { 转移地堡物资 } from "./地堡物资转移.js";

export const 地堡相关指令 = [转移地堡物资, 修建地堡, ...地堡查询相关];
