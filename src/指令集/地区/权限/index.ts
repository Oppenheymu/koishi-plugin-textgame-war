import { 行为管理 } from "./行为管理/index.js";
import { 设置司令 } from "./设置司令.js";
import { 设置总督 } from "./设置总督.js";

export const 地区权限相关指令 = [...行为管理, 设置总督, 设置司令];
