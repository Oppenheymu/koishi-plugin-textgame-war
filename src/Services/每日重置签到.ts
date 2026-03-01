
import { Context } from 'koishi';

/**
 * 检查是否需要进行每日重置
 */
async function 每日重置签到(ctx: Context): Promise<void> {
  const today = new Date().toISOString().split('T')[0]!;

  const record = await ctx.database.get('malieservice', {}, ['上次重置签到日期']);
  const lastReset = record[0]?.上次重置签到日期;

  // 只有当日期发生变化时才重置
  if (!lastReset || today > lastReset) {
    // 需要重置
    await ctx.database.upsert('malieservice', [{
      上次重置签到日期: today
    }], ['上次重置签到日期']);

    // 重置所有玩家的今日签到状态
    await ctx.database.set('malieplayer', {}, { 今日是否签到: false });
  }
}

/**
 * 启动每日重置检查定时任务
 * 每5分钟检查一次，减少性能开销
 */
export function 每日重置签到检查(ctx: Context) {
  ctx.setInterval(() => {
    每日重置签到(ctx);
  }, 5 * 60 * 1000);
}