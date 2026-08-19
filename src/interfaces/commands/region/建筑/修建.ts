import type { Context } from "koishi";
import { 所有建筑, 解析建筑类型 } from "#/interfaces/commands/region/建筑/修建建筑库";
import {
    执行地区建筑修建,
    构建修建回报,
    校验修建资格,
    读取地区容量,
} from "#/interfaces/commands/region/建筑/修建结算";
import { 玩家检查 } from "#ctx/player";
import { 驻扎检查 } from "#ctx/region";

export function 修建地区建筑(ctx: Context) {
    ctx.command("修建地区建筑 <建筑类型:string> [轮次:number]")
        .alias("地区修建")
        .alias("建造地区建筑")
        .alias("建造")
        .alias("修建")
        .action(async ({ session }, 建筑类型输入, 轮次输入) => {
            try {
                const { id, username, 当前驻扎地区, 地区编号, 展示地区名称, 地区资料 } =
                    await 驻扎检查(ctx, session);
                const { 用户资料 } = await 玩家检查(ctx, session);

                if (当前驻扎地区 !== 地区编号) {
                    return `你当前驻扎在 ${当前驻扎地区 || "未驻扎地区"}，仅驻扎在本地区的玩家可修建地区建筑`;
                }

                const 建筑属性 = 解析建筑类型(建筑类型输入);
                if (!建筑属性) {
                    return [
                        "=====[地区建筑]=====",
                        "格式：修建地区建筑 <建筑类型> [轮次]",
                        `支持：${所有建筑.map((项) => 项.name).join("/")}`,
                        "说明：每轮按当前生产力修建，消耗工资、资源与生产次数",
                    ].join("\n");
                }

                const 轮次 = Number.isFinite(轮次输入) ? Math.floor(轮次输入 as number) : 1;
                if (轮次 <= 0) {
                    return "请输入有效轮次（正整数）";
                }

                const 容量 = 读取地区容量(地区资料, 建筑属性);

                const 校验错误 = 校验修建资格(用户资料, 建筑属性, 容量);
                if (校验错误) {
                    return 校验错误;
                }

                const 结算 = await 执行地区建筑修建(
                    ctx,
                    id,
                    地区编号,
                    用户资料,
                    建筑属性,
                    轮次,
                    容量,
                );
                if (typeof 结算 === "string") {
                    return 结算;
                }

                return 构建修建回报({
                    username,
                    展示地区名称,
                    地区编号,
                    建筑属性,
                    轮次,
                    容量,
                    结算,
                });
            } catch (error) {
                return (error as Error).message;
            }
        });
}
