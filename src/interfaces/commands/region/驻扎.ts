import dayjs from "dayjs";
import type { Context } from "koishi";
import { 更新玩家资料 } from "#ctx/player";
import { 驻扎检查 } from "#ctx/region";

export function 驻扎(ctx: Context) {
    ctx.command("驻扎 [地区编号:string]")
        .alias("驻扎地区")
        .alias("设置驻扎")
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { id, username, 当前驻扎地区, 地区编号, 展示地区名称 } = await 驻扎检查(
                    ctx,
                    session,
                    地区编号参数,
                );

                if (当前驻扎地区 === 地区编号) {
                    return `${username} 同志已驻扎在 ${展示地区名称}（${地区编号}）`;
                }

                await 更新玩家资料(ctx, id, {
                    驻扎地区: 地区编号,
                    上次驻扎日期: dayjs().format("YYYY-MM-DD HH:mm"),
                });

                const 旧驻扎提示 = 当前驻扎地区 ? `\n■ 原驻扎地区：${当前驻扎地区}` : "";

                return `
====[征战文游]====
${username} 同志！
驻扎已更新成功
■ 当前驻扎地区：${展示地区名称}（${地区编号}）${旧驻扎提示}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
