
import { Context } from "koishi";
import {} from "koishi-plugin-cron-fix"
import {} from "koishi-plugin-am-i-alt";

import type { PluginConfig } from "./config";
import {
    插件配置Schema,
    默认缓存配置,
    初始化插件运行时配置,
} from "./config";
import { 初始化统一缓存配置 } from "./utils/缓存管理/index";

import { 数据库服务 } from "./models/index";
import { 文游指令集 } from "./指令集/index";
import { 文游服务集 } from "./services/index";
import { 文游管理集 } from "./管理集/index";
import { 批量加载插件 } from "./utils/插件加载";

export const name = "malie-textgame";

export const inject = {
    required: ["database", "cron"],
    optional: ["amIAlt"],
};

export type Config = PluginConfig;
export const Config = 插件配置Schema;



const 文游模块集 = [
    数据库服务,
    文游服务集,
    文游指令集,
    文游管理集,
];

export function apply(ctx: Context, config: Config) {

    初始化插件运行时配置(config);

    初始化统一缓存配置({
        ...默认缓存配置,
        ...(config.cache ?? {}),
    });

    ctx.middleware(async (session, next) => {
        try {
            return await next();
        } catch (error) {
            if ((error as Error).message.includes("Timeout with request send_group_msg")) {
                console.warn("发送群消息超时，已忽略");
                return;
            }
            throw error;
        }
    });

    批量加载插件(ctx, 文游模块集, "文游主模块");

}
