import "./infrastructure/runtime-resolver";
import type { Context } from "koishi";
import "koishi-plugin-cron-fix";
import "koishi-plugin-am-i-alt";

import { 文游指令集 } from "#/composition/指令集";
import { 数据库服务 } from "#/composition/数据库服务";
import { 文游服务集 } from "#/composition/服务集";
import { 文游管理集 } from "#/composition/管理集";
import type { PluginConfig } from "#/config";
import { 初始化插件运行时配置, 插件配置Schema } from "#/config";
import { 批量加载插件 } from "#/infrastructure";
import { 确保空间索引就绪 } from "#ctx/region";

export const name = "malie-textgame";

export const inject = {
    required: ["database", "cron", "amIAlt"],
};

export type Config = PluginConfig;
export const Config = 插件配置Schema;

const 文游模块集 = [数据库服务, 文游服务集, 文游指令集, 文游管理集];

export function apply(ctx: Context, config: Config) {
    初始化插件运行时配置(config);

    ctx.middleware(async (_, next) => {
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

    ctx.on("ready", async () => {
        try {
            await 确保空间索引就绪(ctx);
            ctx.logger("地理空间").info("空间索引初始化完成");
        } catch (error) {
            ctx.logger("地理空间").warn("空间索引初始化失败：", (error as Error).message);
        }
    });
}
