import { Context, Schema } from 'koishi'
import { 数据库服务 } from './Models/index'
import { 文游指令集 } from './指令集/index'
import { 文游服务集 } from './Services/index';
import { 文游管理集 } from './管理集/index';

export const name = 'malie-textgame'
export const inject = {
  required: [ 'cron', 'database' ]
}

export interface Config {}

export const Config: Schema<Config> = Schema.object({})



export function apply(ctx: Context, config: Config) {

    ctx.middleware(async (session, next) => {
        try {
            return await next()
        } catch ( error ) {
            if ( ( error as Error ).message.includes('Timeout with request send_group_msg')) {
                console.warn( '发送群消息超时，已忽略' )
                return;
            }
            throw error
        };
    });

    数据库服务(ctx);
    文游服务集(ctx);
    文游指令集(ctx);
    文游管理集(ctx);

}
