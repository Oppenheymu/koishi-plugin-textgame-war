import { 军事查询指令 } from "./军事/index.js";
import { 我的全部资料 } from "./我的全部资料.js";
import { 我的工人 } from "./我的工人.js";
import { 我的科技 } from "./我的科技.js";
import { 我的资料 } from "./我的资料.js";
import { 我的生产次数 } from "./生产次数.js";
import { 资源相关指令 } from "./资源/index.js";


export const 查询相关指令 = [
    我的资料,
    我的全部资料,
    我的科技,
    我的工人,
    我的生产次数,
    ...军事查询指令,
    ...资源相关指令,
];
