

import { Context } from 'koishi'
import { 签到 } from './签到'
import { 我的资料 } from './我的资料'
import { 我的全部资料 } from './我的全部资料'
import { 我的科技 } from './我的科技'
import { 我的工人 } from './我的工人'
import { 工人休假 } from './工人休假'
import { 生产 } from './生产'
import { 扩建厂房 } from './扩建厂房'
import { 设置工资 } from './设置工资'
import { 提升科技 } from './提升科技'
import { 提升科技到 } from './提升科技到'
import { 召回工人 } from './召回工人'
import { 改进生产技术到 } from './改进生产技术到'



export function 生产指令(ctx: Context) {

    签到(ctx);
    我的资料(ctx);
    我的全部资料(ctx);
    我的科技(ctx);
    我的工人(ctx);
    工人休假(ctx);
    生产(ctx);
    扩建厂房(ctx);
    设置工资(ctx);
    提升科技(ctx);
    提升科技到(ctx);
    召回工人(ctx);
    改进生产技术到(ctx);

}