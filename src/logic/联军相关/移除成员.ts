import {
    Context
} from "koishi";
import type {
    CoalitionArmy
} from "@/types";
import {
    更新玩家资料
} from "@/utils/解析用户/玩家相关/获取数据";

interface 移除联军成员参数 {
    联军编号: string;
    联军资料: CoalitionArmy;
    目标UID: string;
    目标用户ID: number;
}

export async function 移除联军成员(
    ctx: Context, {
        联军编号,
        联军资料,
        目标UID,
        目标用户ID
    }: 移除联军成员参数
): Promise < void > {
    const 新联军成员列表 = {
        ...(联军资料.联军成员列表 ?? {})
    };
    delete 新联军成员列表[目标UID];

    const 过滤成员 = (列表: string[] = []) =>
        列表.filter((成员) => 成员 !== 目标UID);

    const 新联军成员数量 = Object.keys(新联军成员列表).length;

    const 剩余成员UID列表 = Object.keys(新联军成员列表);
    let 新联军总理 = 联军资料.联军总理;

    if (新联军总理 === 目标UID) {
        新联军总理 = 联军资料.联军元首;
    }

    if (!新联军成员列表[新联军总理]) {
        新联军总理 = 剩余成员UID列表[0] ?? "";
    }

    await Promise.all([
        ctx.database.set(
            "马列联军表", {
                联军编号
            }, {
                联军成员列表: 新联军成员列表,
                联军成员数量: 新联军成员数量,
                联军四级权限成员列表: 过滤成员(联军资料.联军四级权限成员列表),
                联军一级权限成员列表: 过滤成员(联军资料.联军一级权限成员列表),
                联军二级权限成员列表: 过滤成员(联军资料.联军二级权限成员列表),
                联军三级权限成员列表: 过滤成员(联军资料.联军三级权限成员列表),
                联军总理: 新联军总理,
            }
        ),
        更新玩家资料(ctx, 目标用户ID, {
            所在联军: null,
        }),
    ]);
}
