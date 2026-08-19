import { 初始化服务表 } from "./初始化服务表.js";
import { 初始化地区表 } from "./地区/index.js";
import { 地区洗牌 } from "./地区洗牌.js";

export const 预设相关指令 = [初始化地区表, 初始化服务表, 地区洗牌];
