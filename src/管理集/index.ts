
import { Context } from "koishi";

import { 预设相关指令 } from "./预设相关";
import { 稽查相关指令 } from "./稽查相关";
import { 设置资源 } from "./增加资源";
import { 审核通过, 审核驳回 } from "./审核通过";



const 管理插件列表 = [
    设置资源,
    审核通过,
    审核驳回,
    ...稽查相关指令,
    ...预设相关指令,
];

// 统一挂载所有数据库相关服务
export function 文游管理集(ctx: Context) {
    for (const 插件 of 管理插件列表) {
        ctx.plugin(插件);
    }
}
