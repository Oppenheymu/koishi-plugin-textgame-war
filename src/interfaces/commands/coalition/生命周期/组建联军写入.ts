import dayjs from "dayjs";
import type { Context } from "koishi";
import { TRandom } from "#/infrastructure";
import type { CoalitionArmy, MemberData } from "#ctx/coalition";
import { 联军政体 } from "#ctx/coalition";
import { 分配坐标逻辑 } from "#ctx/region";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";

export async function 分配建国地区(
    ctx: Context,
    新联军id: number,
    新联军编号: string,
): Promise<{ 新地区: string } | null> {
    const 地区分配结果 = await 分配坐标逻辑(ctx, 新联军id, 新联军编号);

    if (!地区分配结果 || 地区分配结果 === "所有地区已领完！") {
        await ctx.database.remove("马列联军表", {
            id: 新联军id,
        });
        return null;
    }

    return { 新地区: 地区分配结果 };
}

export function 构造新联军数据(输入: {
    uid: string;
    规范联军名称: string;
    新联军编号: string;
    新地区: string;
}): Omit<CoalitionArmy, "id"> {
    const now = dayjs().format("YYYY-M-D-H");

    const 用户: MemberData = {
        联军贡献: 0,
        加入时间: now,
    };

    return {
        联军元首: 输入.uid,
        联军编号: 输入.新联军编号,
        联军名称: 输入.规范联军名称,
        联军总理: "",
        联军四级权限成员列表: [输入.uid],
        联军三级权限成员列表: [],
        联军二级权限成员列表: [],
        联军一级权限成员列表: [],
        联军政治体制: 联军政体.民主制,
        联军成员数量: 1,
        联军成员列表: {
            [输入.uid]: 用户,
        },
        联军首都: 输入.新地区,
        联军地区列表: [输入.新地区],
        联军军队: TRandom(100, 300, 500),
        联军生活资料: TRandom(300, 1000, 2000),
        生活资料分配记录: [],
        联军宣称人口: 0,
        联军宣称兵力: 0,
        扩军计划: undefined,
        当天扩军累计: 0,
        联军税率: 0,
        当天内资本增量: 0,
        三天内资本增量: 0,
        七天内资本增量: 0,
        资本增量历史记录: [],
        名称是否审核: false,
        建立日期: now,
        上次改名日期: now,
    };
}

export async function 写入联军创建数据(
    ctx: Context,
    {
        新联军id,
        新联军数据,
        玩家ID,
        用户资料,
        新联军编号,
    }: {
        新联军id: number;
        新联军数据: Omit<CoalitionArmy, "id">;
        玩家ID: number;
        用户资料: 玩家完整资料;
        新联军编号: string;
    },
): Promise<void> {
    await Promise.all([
        ctx.database.set(
            "马列联军表",
            {
                id: 新联军id,
            },
            新联军数据,
        ),
        ctx.database.set(
            "马列玩家表",
            {
                id: 玩家ID,
            },
            {
                所在联军: 新联军编号,
                曾加入联军列表: [...new Set([...(用户资料.曾加入联军列表 ?? []), 新联军编号])],
            },
        ),
    ]);
}

export async function 回滚联军组建(
    ctx: Context,
    新联军id: number | null,
    新地区: string | null,
): Promise<void> {
    try {
        await Promise.all([
            新联军id !== null
                ? ctx.database.remove("马列联军表", {
                      id: 新联军id,
                  })
                : Promise.resolve(),
            新地区
                ? Promise.all([
                      ctx.database.set(
                          "马列地区状态机",
                          {
                              地区编号: 新地区,
                          },
                          {
                              地区归属国: null,
                              是否已分配: false,
                          },
                      ),
                      ctx.database.set(
                          "马列地区表",
                          {
                              地区编号: 新地区,
                          },
                          {
                              控制国家: "",
                          },
                      ),
                  ])
                : Promise.resolve(),
        ]);
    } catch {}
}
