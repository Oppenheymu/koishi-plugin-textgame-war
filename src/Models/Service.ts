import { Context } from 'koishi';

/**
 * 状态机服务
 * 包含重置日期、签到日期等全局系统信息
 * 注：这个还会改
 */

export function setupServiceModel(ctx: Context) {
  ctx.model.extend('malieservice', {
    上次重置签到日期: { type: 'string', length: 255 },
  }, {
    primary: '上次重置签到日期'
  });
}