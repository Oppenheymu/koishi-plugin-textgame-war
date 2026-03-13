import { Context } from 'koishi'

import { 注册 } from './注册'
import { 签到 } from './签到'
import { 查询相关指令 } from './查询相关'
import { 工人管理指令 } from './工人管理'
import { 生产制造指令 } from './生产制造'
import { 科技相关指令 } from './科技相关'
import { 资源相关指令 } from './资源相关'
import { 地堡相关指令 } from './地堡相关'

const 生产插件列表 = [
  签到,
  注册,
  ...查询相关指令,
  ...工人管理指令,
  ...生产制造指令,
  ...科技相关指令,
  ...资源相关指令,
  ...地堡相关指令,
]

export function 生产指令(ctx: Context) {
  for (const 插件 of 生产插件列表) {
    ctx.plugin(插件)
  }
}
