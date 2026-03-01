

import { Context } from 'koishi'
import{ 签到 } from './签到'


export function 生产指令(ctx: Context) {
    签到(ctx);
}