import type { Context } from "koishi";

/**
 * 初始化地区地形数据表
 */
export function 加载地区地形表(ctx: Context) {
    ctx.model.extend(
        "征战地区地形表",
        {
            地区编号: {
                type: "string",
                length: 255,
            },

            栅格X: {
                type: "unsigned",
                initial: 0,
            },
            栅格Y: {
                type: "unsigned",
                initial: 0,
            },

            是否为海洋: {
                type: "boolean",
            },

            东西宽度公里: {
                type: "float",
                initial: 0,
            },
            南北高度公里: {
                type: "float",
                initial: 0,
            },
            面积平方公里: {
                type: "float",
                initial: 0,
            },

            平均海拔: {
                type: "integer",
            },
            最大海拔: {
                type: "integer",
            },
            最小海拔: {
                type: "integer",
            },
            地区崎岖度: {
                type: "integer",
            },

            水域: {
                type: "float",
            },
            雪地: {
                type: "float",
            },
            草地: {
                type: "float",
            },
            荒地: {
                type: "float",
            },
            森林: {
                type: "float",
            },
            城镇: {
                type: "float",
            },
        },
        {
            primary: "地区编号",
            unique: ["地区编号"],
        },
    );
}
