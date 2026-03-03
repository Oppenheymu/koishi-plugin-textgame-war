
import { Context } from 'koishi';
import { } from "koishi-plugin-cron"; 



/**
 * 执行每日重置
 */
async function 执行每日重置(ctx: Context): Promise<void> {
  const today = new Date().toISOString().split('T')[0]!;

  // 使用固定的 id 获取唯一的全局配置记录
  const serviceRecord = await ctx.database.get('malieservice', { id: 'service' });
  const lastReset = serviceRecord[0]?.上次重置签到日期;

  // 只有当日期发生变化时才重置
  if (!lastReset || today > lastReset) {
    // 使用正确的主键进行更新
    await ctx.database.set('malieservice', { id: 'service' }, {
      上次重置签到日期: today
    });

    // 重置所有玩家的今日签到状态
    await ctx.database.set('malieplayer', {}, { 今日是否签到: false });
  }
}

/**
 * 启动每日重置检查定时任务
 * 使用 cron 轮询：每5分钟检查一次，比 setInterval 更可靠
 */
export function 每日重置签到检查(ctx: Context) {
  ctx.cron('*/5 * * * *', () => {
    执行每日重置(ctx);
  });
}