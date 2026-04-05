import { Context } from "koishi";
import {
    创建改名审核工单,
    检查名称是否重复,
    检查改名冷却,
    校验名称文本,
    玩家检查,
} from "../../../utils";

export function 修改玩家名称(ctx: Context) {
    ctx.command("修改玩家名称 <新名称:string>").alias('改名')
        .action( async ({ session }, 新名称) => {
            try {
                const { id, uid, username, 用户配置 } = await 玩家检查(
                    ctx,
                    session,
                );

                const 改名冷却提示 = 检查改名冷却(
                    用户配置.上次改名日期,
                    "玩家",
                );
                if (改名冷却提示) {
                    return 改名冷却提示;
                }

                const 规范名称 = 新名称?.trim() ?? "";
                const 校验结果 = 校验名称文本(规范名称, "玩家");
                if (校验结果) {
                    return 校验结果;
                }

                const 重名类型 = await 检查名称是否重复(ctx, 规范名称, {
                    排除玩家ID: id,
                });
                if (重名类型) {
                    return `该名称已被${重名类型}使用，请更换名称`;
                }

                const { 工单编号 } = await 创建改名审核工单(ctx, {
                    类型: "玩家",
                    新名称: 规范名称,
                    申请人ID: id,
                    申请人UID: uid,
                    申请人名称: username,
                    玩家ID: id,
                });

                return `
====[征战文游]====
${username} 同志！
你的改名申请已提交审核。
工单编号：#${工单编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        },
    );
}
