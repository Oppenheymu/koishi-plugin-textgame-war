import dayjs from "dayjs";
import { Context } from "koishi";
import { 审核群号, 改名工单池, 获取下一个工单编号 } from "./state";
import { 改名类型, 改名审核工单 } from "./types";

export async function 创建改名审核工单(
    ctx: Context,
    payload: {
        类型: 改名类型;
        新名称: string;
        申请人ID: number;
        申请人UID: string;
        申请人名称: string;
        玩家ID?: number;
        联军编号?: string;
        地区编号?: string;
    },
): Promise<{ 工单编号: number }> {
    const 工单编号 = 获取下一个工单编号();
    const 工单: 改名审核工单 = {
        工单编号,
        状态: "待审核",
        创建时间: dayjs().format("YYYY-M-D-H"),
        ...payload,
    };

    改名工单池.set(工单编号, 工单);

    const 目标标识 =
        工单.类型 === "联军"
            ? `联军编号：${工单.联军编号}`
            : 工单.类型 === "地区"
              ? `地区编号：${工单.地区编号}`
              : `玩家ID：${工单.玩家ID}`;

    const 推送文本 = [
        `【改名工单 #${工单编号}】`,
        `类型：${工单.类型}`,
        `申请人：${工单.申请人名称}（UID:${工单.申请人UID}）`,
        目标标识,
        `新名称：${工单.新名称}`,
        `创建时间：${工单.创建时间}`,
        "管理员回复本条消息并发送【审核通过】或【审核驳回】",
    ].join("\n");

    const onebotBot = Object.values(ctx.bots).find(
        (bot) => bot.platform === "onebot",
    );

    if (onebotBot) {
        try {
            await onebotBot.sendMessage(审核群号, 推送文本);
        } catch {}
    }

    return { 工单编号 };
}
