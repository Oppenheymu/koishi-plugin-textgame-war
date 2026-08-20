import type { Context } from "koishi";
import type { Player } from "#ctx/player/domain/types/基本类型";

import type { PlayerWarData } from "#ctx/player/domain/types/战争类型";

const 玩家档案字段集合 = new Set<keyof Player>([
    "id",
    "uid",
    "所在联军",
    "战争保护期",
    "曾加入联军列表",
    "驻扎地区",
    "上次驻扎日期",
    "上次炮击时间",
    "今日是否签到",
    "小时是否生产",
    "稳定度",
    "生产次数",
    "工人工资",
    "工人招募限额",
    "生活资料",
    "生产技术",
    "厂房",
    "工人",
    "地下工人",
    "休假工人",
    "科技等级",
    "科技蓝图",
    "科技池投入",
    "科技池容量",
    "石油",
    "铝土矿",
    "金属铝",
    "铁矿石",
    "钢铁",
    "铀矿",
    "浓缩铀",
    "钚",
    "生物武器",
]);

const 玩家战争字段集合 = new Set<keyof PlayerWarData>([
    "id",
    "uid",
    "步兵装备",
    "卡车",
    "两栖坦克",
    "轻型坦克",
    "中型坦克",
    "重型坦克",
    "现代坦克",
    "装甲运兵车",
    "两栖装甲运兵车",
    "坦克歼击车",
    "自行防空车",
    "野战炮",
    "火炮",
    "火箭炮",
    "列车炮",
    "火箭弹",
    "防空弹药",
    "轻型航弹",
    "重型航弹",
    "侦察机",
    "战斗机",
    "预警机",
    "战术轰炸机",
    "战略轰炸机",
    "隐形轰炸机",
    "大型运输机",
    "小型运输机",
    "巡航中的预警机",
    "巡航中的战斗机",
    "地下工厂投入",
    "是否有地下工厂",
    "地下机库投入",
    "是否有地下机库",
    "地下弹药库投入",
    "是否有地下弹药库",
    "地下侦察机",
    "地下战斗机",
    "地下预警机",
    "地下战术轰炸机",
    "地下战略轰炸机",
    "地下隐形轰炸机",
    "地下大型运输机",
    "地下小型运输机",
    "地下火箭弹",
    "地下防空弹药",
]);

export async function 更新玩家资料(
    ctx: Context,
    id: number,
    更新数据: Partial<Player & PlayerWarData>,
): Promise<void> {
    const 玩家更新: Record<string, unknown> = {};
    const 战争更新: Record<string, unknown> = {};

    for (const [键, 值] of Object.entries(更新数据 as Record<string, unknown>)) {
        if (键 === "id" || 键 === "uid") continue;

        if (玩家档案字段集合.has(键 as keyof Player)) {
            玩家更新[键] = 值;
        }

        if (玩家战争字段集合.has(键 as keyof PlayerWarData)) {
            战争更新[键] = 值;
        }
    }

    const 任务: Promise<unknown>[] = [];

    if (Object.keys(玩家更新).length > 0) {
        任务.push(ctx.database.set("征战玩家表", { id }, 玩家更新));
    }

    if (Object.keys(战争更新).length > 0) {
        任务.push(ctx.database.set("征战玩家战争表", { id }, 战争更新));
    }

    if (任务.length > 0) {
        await Promise.all(任务);
    }
}
