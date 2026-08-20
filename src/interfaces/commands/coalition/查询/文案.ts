import type { Context } from "koishi";

/** 联军查询分组共用文案（随 查询指令 数组装配注册） */
export function 注册联军查询文案(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition", {
        "not-in-coalition": "{user} 同志目前不在任何联军中",
        "data-missing": "数据异常：已记录所在联军但未找到联军档案，请联系管理员",
    });
}
