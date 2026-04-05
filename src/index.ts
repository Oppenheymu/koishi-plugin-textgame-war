import { Context, Schema } from "koishi";
import { 数据库服务 } from "./models/index";
import { 文游指令集 } from "./指令集/index";
import { 文游服务集 } from "./services/index";
import { 文游管理集 } from "./管理集/index";
import { 批量加载插件 } from "./utils/插件加载器";
import {} from "koishi-plugin-am-i-alt";

export const name = "malie-textgame";
export const inject = {
    required: ["database"],
    optional: ["cron", "amIAlt"],
};

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

const 文游模块集 = [
    数据库服务,
    文游服务集,
    文游指令集,
    文游管理集
]

export function apply(ctx: Context, config: Config) {

    ctx.middleware(async (session, next) => {
        try {
            return await next();
        } catch (error) {
            if (
                (error as Error).message.includes(
                    "Timeout with request send_group_msg",
                )
            ) {
                console.warn("发送群消息超时，已忽略");
                return;
            }
            throw error;
        }
    });

    批量加载插件(ctx, 文游模块集, "文游主模块");
}
