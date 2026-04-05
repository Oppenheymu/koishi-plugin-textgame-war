import { Context } from "koishi";
import { 玩家联军检查, 生成随机图片片段 } from "../../Utils";

const 图片概率 = 0.01;
const 图片池 = ["行军.jpg", "行军2.jpg", "行军3.jpg", "阅兵2.jpg"];

export function 扩军(ctx: Context) {
    ctx.command("扩军 <数量:number>")
        .alias("扩军")
        .action(async ({ session }, 数量) => {
            try {
                const { uid, id, username, 用户资料, 联军资料, 联军编号 } =
                    await 玩家联军检查(ctx, session);
                const 格式化 = (n: number) => n.toLocaleString("zh-CN");

                if (!数量) {
                    return `
【红色战争】
${username}同志：
■格式：扩军 <数量>
■作用：消耗工人，按1:1扩充到联军军队`.trim();
                }

                if (!Number.isInteger(数量) || 数量 <= 0) {
                    return "请输入正确的扩军数量";
                }

                if (用户资料.工人 < 数量) {
                    return "工人不足，无法扩军";
                }

                const 新工人 = 用户资料.工人 - 数量;
                const 新联军军队 = 联军资料.联军军队 + 数量;
                const 新联军贡献 = 联军资料.联军成员列表[uid].联军贡献 + 数量 * 10;
                const 新联军成员列表 = {
                    ...联军资料.联军成员列表,
                    [uid]: {
                        ...联军资料.联军成员列表[uid],
                        联军贡献: 新联军贡献,
                    },
                };

                await Promise.all([
                    ctx.database.set("马列玩家表", { id }, { 工人: 新工人 }),
                    ctx.database.set(
                        "马列联军表",
                        { 联军编号 },
                        {
                            联军军队: 新联军军队,
                            联军成员列表: 新联军成员列表,
                        },
                    ),
                ]);

                const 图片片段 = 生成随机图片片段(图片池, 图片概率);

                const 文本消息 = `
====[红色战争]====
${username}同志：
扩军完成！
■联军军队规模：${格式化(新联军军队)}(+${格式化(数量)})
■工人：${格式化(新工人)}(-${格式化(数量)})`.trim();

                return 图片片段 ? `${文本消息}\n${图片片段}` : 文本消息;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
