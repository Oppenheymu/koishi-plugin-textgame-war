import { Context } from "koishi";

let 正在执行联军资本统计 = false;

const 格式化日期 = (时间: Date) =>
  `${时间.getFullYear()}-${String(时间.getMonth() + 1).padStart(2, "0")}-${String(
    时间.getDate()
  ).padStart(2, "0")}`;

function 计算区间资本增量(历史记录: number[], 当天内资本增量: number) {
  const 近三天 = 历史记录.slice(-2).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;
  const 近七天 = 历史记录.slice(-6).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;

  return {
    近三天,
    近七天,
  };
}

export async function 记录联军资本增量(
  ctx: Context,
  联军编号: string,
  当次资本增量: number,
  本次上缴生活资料 = 0
): Promise<void> {
  const 安全增量 = Math.max(0, 当次资本增量);
  const 安全上缴 = Math.max(0, Math.floor(本次上缴生活资料));

  if (安全增量 <= 0 && 安全上缴 <= 0) return;

  const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
  if (!联军资料) return;

  const 当前当天增量 = (联军资料.当天内资本增量 ?? 0) + 安全增量;
  const 历史记录 = 联军资料.资本增量历史记录 ?? [];
  const { 近三天, 近七天 } = 计算区间资本增量(历史记录, 当前当天增量);

  await ctx.database.set(
    "马列联军表",
    { 联军编号 },
    {
      联军生活资料: (联军资料.联军生活资料 ?? 0) + 安全上缴,
      当天内资本增量: 当前当天增量,
      三天内资本增量: 近三天,
      七天内资本增量: 近七天,
    }
  );
}

async function 执行联军资本增量日结(ctx: Context): Promise<void> {
  if (正在执行联军资本统计) return;
  正在执行联军资本统计 = true;

  try {
    const 今天 = 格式化日期(new Date());

    const [服务记录] = await ctx.database.get("马列服务表", { id: "service" });

    if (!服务记录) {
      await ctx.database.create("马列服务表", {
        id: "service",
        上次联军资本统计日期: 今天,
      });
      return;
    }

    if (服务记录.上次联军资本统计日期 && 服务记录.上次联军资本统计日期 >= 今天) {
      return;
    }

    const 联军列表 = await ctx.database.get("马列联军表", {});

    for (const 联军资料 of 联军列表) {
      const 昨日增量 = 联军资料.当天内资本增量 ?? 0;
      let 历史记录 = [...(联军资料.资本增量历史记录 ?? []), 昨日增量];

      if (历史记录.length > 7) {
        历史记录 = 历史记录.slice(-7);
      }

      const 三天合计 = 历史记录.slice(-3).reduce((总和, 数值) => 总和 + 数值, 0);
      const 七天合计 = 历史记录.slice(-7).reduce((总和, 数值) => 总和 + 数值, 0);

      await ctx.database.set(
        "马列联军表",
        { 联军编号: 联军资料.联军编号 },
        {
          当天内资本增量: 0,
          三天内资本增量: 三天合计,
          七天内资本增量: 七天合计,
          资本增量历史记录: 历史记录,
        }
      );
    }

    await ctx.database.set(
      "马列服务表",
      { id: "service" },
      { 上次联军资本统计日期: 今天 }
    );
  } finally {
    正在执行联军资本统计 = false;
  }
}

export function 每日联军资本增量统计(ctx: Context) {
  ctx.cron("*/5 * * * *", () => {
    执行联军资本增量日结(ctx);
  });
}
