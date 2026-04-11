import {
    Context
} from "koishi";

/**
 * 状态机服务
 * 包含重置日期、签到日期等全局系统信息
 * 注：这个还会改
 */

export function 加载服务表(ctx: Context) {
    ctx.model.extend(
        "马列服务表", {
            id: {
                type: "string",
                length: 255
            },

            当前地区洗牌指针: {
                type: "unsigned",
                initial: 0
            },
            上次重置签到日期: {
                type: "string",
                length: 255,
                nullable: true
            },
            上次全服统计日期: {
                type: "string",
                length: 255,
                nullable: true
            },
        }, {
            primary: "id",
        }
    );
}