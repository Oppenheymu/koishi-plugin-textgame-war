

import { Context } from 'koishi'
import { 签到 } from './签到'
import { 我的资料 } from './我的资料'
import { 我的全部资料 } from './我的全部资料'
import { 我的科技 } from './我的科技'
import { 我的工人 } from './我的工人'
import { 提升科技 } from './提升科技'
import { 提升科技到 } from './提升科技到'



export function 生产指令(ctx: Context) {
    签到(ctx);
    我的资料(ctx);
    我的全部资料(ctx);
    我的科技(ctx);
    我的工人(ctx);
    提升科技(ctx);
    提升科技到(ctx);
}