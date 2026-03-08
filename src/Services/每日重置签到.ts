
import { Context } from 'koishi';
import { } from "koishi-plugin-cron";

let 正在执行每日重置 = false;

/**
 * 执行每日重置
 */
async function 执行每日重置(ctx: Context): Promise<void> {
  if (正在执行每日重置) return;
  正在执行每日重置 = true;

  try {
    const 现在 = new Date();
    // 使用本地时间构建日期字符串 YYYY-MM-DD，避免使用 UTC (toISOString) 导致时区偏差
    const 今天 = `${现在.getFullYear()}-${String(现在.getMonth() + 1).padStart(2, '0')}-${String(现在.getDate()).padStart(2, '0')}`;

    const 全局状态机 = await ctx.database.get('malieservice', { id: 'service' });
    const 服务记录 = 全局状态机[0];

    // 首次启动时若服务记录不存在，先创建再执行一次重置，避免后续每次检查都重复重置
    if (!服务记录) {
      await ctx.database.create('malieservice', {
        id: 'service',
        上次重置签到日期: 今天,
      });
      await ctx.database.set('malieplayer', {}, { 今日是否签到: false, 工人招募限额: 1000 });
      return;
    }

    const 上次重置时间 = 服务记录.上次重置签到日期;

    // 只有当日期发生变化时才重置
    if (!上次重置时间 || 今天 > 上次重置时间) {
      await ctx.database.set('malieservice', { id: 'service' }, {
        上次重置签到日期: 今天,
      });

      await ctx.database.set('malieplayer', {}, { 今日是否签到: false, 工人招募限额: 1000 });
    }
  } finally {
    正在执行每日重置 = false;
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
