import { Context } from "koishi";
import {
    创建改名审核工单,
    检查名称是否重复,
    检查改名冷却,
    校验名称文本,
    玩家联军检查,
} from "../../../utils";

export function 修改联军名称(ctx: Context) {
    ctx.command("修改联军名称 <新名称:string>").alias('联军改名 ')
        .action( async ({ session }, 新名称) => {
            try {
                const { id, uid, username, 联军编号, 联军资料 } =
                    await 玩家联军检查(ctx, session, {
                        最低权限等级: 1,
                        是否必须在成员列表: true,
                    });

                const 改名冷却提示 = 检查改名冷却(
                    联军资料.上次改名日期,
                    "联军",
                );
                if (改名冷却提示) {
                    return 改名冷却提示;
                }

                const 规范名称 = 新名称?.trim() ?? "";
                const 校验结果 = 校验名称文本(规范名称, "联军");
                if (校验结果) {
                    return 校验结果;
                }

                const 重名类型 = await 检查名称是否重复(ctx, 规范名称, {
                    排除联军编号: 联军编号,
                });
                if (重名类型) {
                    return `该名称已被${重名类型}使用，请更换名称`;
                }

                const { 工单编号 } = await 创建改名审核工单(ctx, {
                    类型: "联军",
                    新名称: 规范名称,
                    申请人ID: id,
                    申请人UID: uid,
                    申请人名称: username,
                    联军编号,
                });

                return `
====[征战文游]====
${username} 同志！
联军改名申请已提交审核。
联军编号：${联军编号}
工单编号：#${工单编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        },
    );
}
