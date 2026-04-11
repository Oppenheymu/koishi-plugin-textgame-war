import {
    Context
} from "koishi";
import {
    玩家检查,
    地区解析
} from "../../utils";

export function 我的驻扎(ctx: Context) {
    ctx.command("我的驻扎")
        .alias("驻扎信息")
        .alias("查看驻扎")
        .action(async ({
            session
        }) => {
            try {
                const {
                    username,
                    用户资料
                } = await 玩家检查(ctx, session);

                const 驻扎地区 = 用户资料.驻扎地区?.trim();
                if (!驻扎地区) {
                    return `${username} 同志当前未驻扎，请发送：驻扎 地区编号`;
                }

                const {
                    地区编号,
                    展示地区名称,
                    地区资料,
                } = await 地区解析(ctx, 驻扎地区, session);

                return `
====[征战文游]====
${username} 同志！
■ 驻扎地区：${展示地区名称}（${地区编号}）
■ 地区总督：${地区资料.地区总督 || "暂无"}
■ 控制国家：${地区资料.控制国家?.trim() || "无"}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
