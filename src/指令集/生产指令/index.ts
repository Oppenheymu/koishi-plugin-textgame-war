import { Context } from 'koishi'
import { 注册 } from './注册'
import { 签到 } from './签到'

import { 我的全部资料 } from './查询相关/我的全部资料'
import { 我的工人 } from './查询相关/我的工人'
import { 我的科技 } from './查询相关/我的科技'
import { 我的资料 } from './查询相关/我的资料'

import { 召回工人 } from './工人管理/召回工人'
import { 工人休假 } from './工人管理/工人休假'
import { 招募工人 } from './工人管理/招募工人'
import { 查看全球劳动力市场 } from './工人管理/查看全球劳动力市场'
import { 设置工资 } from './工人管理/设置工资'

import { 军事生产 } from './生产制造/军事生产'
import { 扩建厂房 } from './生产制造/扩建厂房'
import { 改进生产技术到 } from './生产制造/改进生产技术到'
import { 生产 } from './生产制造/生产'

import { 使用科技蓝图 } from './科技相关/使用科技蓝图'
import { 提升科技 } from './科技相关/提升科技'
import { 提升科技到 } from './科技相关/提升科技到'

import { 土法炼钢 } from './资源相关/土法炼钢'
import { 开采石油 } from './资源相关/开采石油'
import { 开采铁矿石 } from './资源相关/开采铁矿石'
import { 开采铝土矿 } from './资源相关/开采铝土矿'

import { 修建地堡 } from './地堡相关/修建地堡'
import { 我的地下工厂 } from './地堡相关/我的地下工厂'
import { 我的地下弹药库 } from './地堡相关/我的地下弹药库'
import { 我的地下机库 } from './地堡相关/我的地下机库'
import { 我的地堡 } from './地堡相关/我的地堡'
import { 转入地下 } from './地堡相关/转入地下'
import { 转入地面 } from './地堡相关/转入地面'

export function 生产指令(ctx: Context) {

  签到(ctx)
  注册(ctx)

  我的资料(ctx)
  我的全部资料(ctx)
  我的科技(ctx)
  我的工人(ctx)

  工人休假(ctx)
  设置工资(ctx)
  招募工人(ctx)
  召回工人(ctx)
  查看全球劳动力市场(ctx)

  生产(ctx)
  扩建厂房(ctx)
  改进生产技术到(ctx)
  军事生产(ctx)

  提升科技(ctx)
  提升科技到(ctx)
  使用科技蓝图(ctx)

  开采石油(ctx)
  开采铁矿石(ctx)
  开采铝土矿(ctx)
  土法炼钢(ctx)

  我的地堡(ctx)
  我的地下工厂(ctx)
  我的地下机库(ctx)
  我的地下弹药库(ctx)
  转入地下(ctx)
  转入地面(ctx)
  修建地堡(ctx)
  
}
