import type { Context } from 'koishi';
import 'koishi-plugin-cron-fix';
import 'koishi-plugin-infra-am-i-alt';
import { register as 注册路径别名 } from 'tsconfig-paths';

注册路径别名({
    baseUrl: __dirname,
    paths: {
        '@/*': ['*'],
        '@utils/*': ['utils/*'],
        '@logic/*': ['logic/*'],
    },
});

import type { PluginConfig } from './config';
import { 初始化插件运行时配置, 插件配置Schema } from './config';

import { 数据库服务 } from './models/index';
import { 文游服务集 } from './services/index';
import { 批量加载插件 } from './utils/插件加载';
import { 文游指令集 } from './指令集/index';
import { 文游管理集 } from './管理集/index';

export const name = 'malie-textgame';

export const inject = {
    required: ['database', 'cron', 'amIAlt'],
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
            if ((error as Error).message.includes('Timeout with request send_group_msg')) {
                console.warn('发送群消息超时，已忽略');
                return;
            }
            throw error;
        }
    });

    批量加载插件(ctx, 文游模块集, '文游主模块');
}
