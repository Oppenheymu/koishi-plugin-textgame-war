import type { Context } from "koishi";
import { 生成随机图片片段 } from "#/infrastructure";
import { 物品属性名, 物品库 } from "#/interfaces/commands/player/生产/军事生产物品库";
import {
    构建更新数据,
    构建消耗明细,
    校验生产请求,
    校验生产资源,
    组装生产结果文本,
    计算生产消耗,
} from "#/interfaces/commands/player/生产/军事生产结算";
import { 更新玩家资料, 玩家检查 } from "#ctx/player";

const 图片概率 = 0.01;
const 图片池 = ["军工厂3.jpg"];

export function 军事生产(ctx: Context) {
    ctx.command("军事生产 <物品> <数量:number>")
        .alias("军产")
        .action(async ({ session }, 物品, 数量) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);

                const 请求错误 = 校验生产请求(物品, 数量, 用户资料);
                if (请求错误) return 请求错误;

                const 物品类型 = 物品库[物品];
                if (!物品类型)
                    return `物品 "${物品}" 不存在。可用物品：${Object.keys(物品库).join("、")}`;

                // 验证科技
                if (用户资料.科技等级 < 物品类型.科技需求) {
                    return `科技等级不足！需要 ${物品类型.科技需求}, 现有 ${用户资料.科技等级}`;
                }

                // 步兵装备每次最少生产100，且数量需为100的整数倍
                if (物品 === "步兵装备" && (数量 < 100 || 数量 % 100 !== 0)) {
                    return "步兵装备每次最少生产100，且数量需为100的整数倍";
                }

                const 消耗 = 计算生产消耗(物品, 数量, 物品类型, 用户资料);
                const 资源错误 = 校验生产资源(用户资料, 消耗);
                if (资源错误) return 资源错误;

                // 获取物品对应的属性名
                const 属性名 = 物品属性名[物品];
                if (!属性名) return "物品属性映射错误";

                // 保存到数据库
                await 更新玩家资料(ctx, id, 构建更新数据(用户资料, 消耗, 属性名, 数量));

                const 图片片段 = 生成随机图片片段(图片池, 图片概率);
                const 文本消息 = 组装生产结果文本(
                    username,
                    数量,
                    物品类型.name,
                    构建消耗明细(消耗),
                );

                return 图片片段 ? `${文本消息}\n${图片片段}` : 文本消息;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
