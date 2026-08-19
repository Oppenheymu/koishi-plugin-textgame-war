import type { Context } from "koishi";
import {
    地区编号转经纬度,
    地区解析,
    格式化经纬度,
    格式化距离,
    解析地区编号,
    计算方向,
    计算真实距离,
} from "#ctx/region";

export function 查看距离(ctx: Context) {
    ctx.command("距离 <起点地区编号:string> <终点地区编号:string>")
        .alias("计算距离")
        .action(async (_, 起点编号, 终点编号) => {
            try {
                if (!起点编号 || !终点编号) {
                    return "请提供起点和终点地区编号，例如：距离 00000 15979";
                }

                const { 地区资料: 起点资料 } = await 地区解析(ctx, 起点编号.trim());
                const { 地区资料: 终点资料 } = await 地区解析(ctx, 终点编号.trim());

                const 起点 = 起点编号.trim();
                const 终点 = 终点编号.trim();

                const 距离 = 计算真实距离(起点, 终点);
                const 方向 = 计算方向(解析地区编号(起点), 解析地区编号(终点));
                const 起点经纬度 = 地区编号转经纬度(起点);
                const 终点经纬度 = 地区编号转经纬度(终点);

                return [
                    "【距离查询】",
                    `■ 起点：`,
                    `${起点} (${起点资料.栅格X}, ${起点资料.栅格Y}) ${格式化经纬度(起点经纬度)}`,
                    `■ 终点：`,
                    `${终点} (${终点资料.栅格X}, ${终点资料.栅格Y}) ${格式化经纬度(终点经纬度)}`,
                    `■ 直线距离：${格式化距离(距离)}`,
                    `■ 方向：${方向}`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
