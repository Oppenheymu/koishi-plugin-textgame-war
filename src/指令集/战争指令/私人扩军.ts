import {
    Context
} from "koishi";
import {
    玩家检查,
    更新玩家资料
} from "../../utils";

export function 私人扩军(ctx: Context) {
    ctx.command("私人扩军 <数量:number>").action(async ({
        session
    }, 数量) => {
        try {
            const {
                id,
                username,
                用户资料
            } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            if (!数量) {
                return `
【红色战争】
${username}同志：
■格式：私人扩军 <数量>
■作用：消耗工人，按1:1扩充私人军队`.trim();
            }

            if (!Number.isInteger(数量) || 数量 <= 0) {
                return "请输入正确的扩军数量";
            }

            if (用户资料.工人 < 数量) {
                return "工人不足，无法扩军";
            }

            const 新工人 = 用户资料.工人 - 数量;
            const 新私人军队 = 用户资料.私人军队 + 数量;

            await 更新玩家资料(ctx, id, {
                工人: 新工人,
                私人军队: 新私人军队,
            });

            return `
【红色战争】
${username}同志：
==扩军完成==
■私人军队规模：${格式化(新私人军队)}(+${格式化(数量)})
■工人：${格式化(新工人)}(-${格式化(数量)})`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}