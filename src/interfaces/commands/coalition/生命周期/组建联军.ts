import type { Context } from "koishi";
import { 获取联军Sqids } from "#/infrastructure";
import {
    写入联军创建数据,
    分配建国地区,
    回滚联军组建,
    构造新联军数据,
} from "#/interfaces/commands/coalition/生命周期/组建联军写入";
import {
    校验名称合规,
    校验名称非空,
    校验小号身份,
    校验玩家可组建联军,
} from "#/interfaces/commands/coalition/生命周期/组建联军校验";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon";
import { 创建改名审核工单 } from "#ctx/naming";
import { 玩家检查 } from "#ctx/player";

export function 组建联军(ctx: Context) {
    ctx.command("组建联军 <联军名称:string>")
        .alias("组建国家")
        .alias("创建国家")
        .alias("建国")
        .action(async ({ session }, 联军名称) => {
            let 新联军id: number | null = null;
            let 新地区: string | null = null;

            try {
                const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

                const 小号提示 = await 校验小号身份(ctx, session);
                if (小号提示) {
                    return 小号提示;
                }

                const 名称校验结果 = 校验名称非空(联军名称, username);
                if (typeof 名称校验结果 === "string") {
                    return 名称校验结果;
                }
                const { 规范联军名称 } = 名称校验结果;

                const 资格提示 = await 校验玩家可组建联军(ctx, uid, username, 用户资料);
                if (资格提示) {
                    return 资格提示;
                }

                const 名称提示 = await 校验名称合规(ctx, 规范联军名称, username);
                if (名称提示) {
                    return 名称提示;
                }

                const 新联军配置 = await ctx.database.create("马列联军表", {});
                新联军id = 新联军配置.id;

                const 新联军编号 = `A${获取联军Sqids().encode([新联军id])}`;
                const 地区分配 = await 分配建国地区(ctx, 新联军id, 新联军编号);
                if (!地区分配) {
                    return "地区已全部分配完毕，暂时无法组建联军。";
                }
                新地区 = 地区分配.新地区;

                const 新联军数据 = 构造新联军数据({
                    uid,
                    规范联军名称,
                    新联军编号,
                    新地区,
                });

                await 写入联军创建数据(ctx, {
                    新联军id,
                    新联军数据,
                    玩家ID: id,
                    用户资料,
                    新联军编号,
                });

                const { 工单编号 } = await 创建改名审核工单(ctx, {
                    类型: "联军",
                    新名称: 规范联军名称,
                    申请人ID: id,
                    申请人UID: uid,
                    申请人名称: username,
                    联军编号: 新联军编号,
                });

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号: 新联军编号,
                    通报标题: "联军建国通报",
                    通报内容: `${username} 成功组建新联军（待改名审核）`,
                });

                return `
====[征战文游]====
联军组建成功！
□ 联军名称: ***
□ 联军编号: ${新联军编号}
□ 审核工单: #${工单编号}（待审核）

分配的地区: ${新地区}
`.trim();
            } catch (error) {
                await 回滚联军组建(ctx, 新联军id, 新地区);
                return (error as Error).message;
            }
        });
}
