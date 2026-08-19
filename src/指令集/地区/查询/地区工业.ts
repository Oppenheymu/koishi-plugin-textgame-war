import type { Context } from "koishi";
import { 格式化, 地区解析, 当前地区解析  } from "#/utils";
import { 地区编号转经纬度, 格式化经纬度 } from "#/地理集";


export function 查看地区工业(ctx: Context) {
    ctx.command("地区工业 [地区编号:string]")
        .alias("查看地区工业")
        .alias("查看城市工业")
        .action(async ({ session }, 地区编号参数) => {
            try {
                const 规范地区编号 = 地区编号参数?.trim();
                const { 地区编号, 地区资料, 展示地区名称 } = 规范地区编号
                    ? await 地区解析(ctx, 规范地区编号)
                    : await 当前地区解析(ctx, session);

                const 经纬度 = 地区编号转经纬度(地区编号);

                const 电解铝在用 = Math.max(0, 地区资料.电解铝厂数量 - 地区资料.空闲的电解铝厂);
                const 炼钢在用 = Math.max(0, 地区资料.炼钢厂数量 - 地区资料.空闲的炼钢厂);

                return [
                    "【地区工业】",
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 坐标：(${地区资料.栅格X}, ${地区资料.栅格Y}) ${格式化经纬度(经纬度)}`,
                    `■ 电解铝厂：${格式化(地区资料.空闲的电解铝厂)} / ${格式化(地区资料.电解铝厂数量)}（空闲/总量）`,
                    `□ 电解铝厂在用：${格式化(电解铝在用)}`,
                    `■ 炼钢厂：${格式化(地区资料.空闲的炼钢厂)} / ${格式化(地区资料.炼钢厂数量)}（空闲/总量）`,
                    `□ 炼钢厂在用：${格式化(炼钢在用)}`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
