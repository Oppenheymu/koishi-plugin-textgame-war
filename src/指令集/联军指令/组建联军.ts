import { Context } from "koishi";
import dayjs from "dayjs";
import Sqids from "sqids";
import {} from "koishi-plugin-am-i-alt";
import { CoalitionArmy, MemberData, 联军政体 } from "../../Types";
import {
    分配坐标逻辑,
    检查名称是否重复,
    检查违禁词,
    玩家检查,
} from "../../Utils/";

const sqids = new Sqids({
    alphabet: "9087564312",
    minLength: 5,
    blocklist: new Set([]),
});

export function 组建联军(ctx: Context) {
    ctx.command("组建联军 <联军名称:string>")
        .alias("组建国家")
        .alias("创建国家")
        .alias("建国")
        .action(async ({ session }, 联军名称) => {
            let 新联军ID: number | null = null;
            let 新地区: string | null = null;

            try {
                const { id, uid, username, 用户资料 } = await 玩家检查(
                    ctx,
                    session,
                );

                const amIAlt服务 = (
                    ctx as Context & {
                        amIAlt?: {
                            isAlt: (session: unknown) => Promise<boolean>;
                        };
                    }
                ).amIAlt;

                if (amIAlt服务 && (await amIAlt服务.isAlt(session)) === true) {
                    return "疑似小号禁止组建联军";
                }

                const 规范联军名称 = 联军名称?.trim();
                if (!规范联军名称) {
                    return `
=====[国家]=====
${username} 同志！
请提供国家名称。
如：组建国家 共和国
`.trim();
                }

                if (用户资料.所在联军) {
                    return `
=====[国家]=====
${username} 同志！
你已加入联军（${用户资料.所在联军}），无法重复组建。
`.trim();
                }

                const [已创建联军] = await ctx.database.get(
                    "马列联军表",
                    { 联军元首: uid },
                    ["联军编号", "联军名称"],
                );
                if (已创建联军) {
                    return `
=====[国家]=====
${username} 同志！
你已组建过联军（${已创建联军.联军名称} / ${已创建联军.联军编号}）。
`.trim();
                }

                if (规范联军名称.length < 2 || 规范联军名称.length > 12) {
                    return `
=====[国家]=====
${username} 同志！
国名须在2到12字符间
`.trim();
                }

                const 合法字符 = /^[\u4e00-\u9fa5]+$/;
                if (!合法字符.test(规范联军名称)) {
                    return `
======[国家]=====
${username} 同志！
国家名称只能包含中文。
`.trim();
                }

                const 命中违禁词 = 检查违禁词(规范联军名称);
                if (命中违禁词) {
                    return `国家名称包含不允许的词语`;
                }

                const 重名类型 = await 检查名称是否重复(ctx, 规范联军名称);
                if (重名类型) {
                    return `
=====[国家]=====
${username} 同志！
该国家名称已被${重名类型}使用，请更换名称。
`.trim();
                }

                const 新联军配置 = await ctx.database.create("马列联军表", {});
                新联军ID = 新联军配置.id;

                const 新联军编号 = `A${sqids.encode([新联军ID])}`;
                const 地区分配结果 = await 分配坐标逻辑(ctx, 新联军ID);

                if (地区分配结果 === "所有地区已领完！") {
                    await ctx.database.remove("马列联军表", { id: 新联军ID });
                    return "地区已全部分配完毕，暂时无法组建联军。";
                }

                新地区 = 地区分配结果;

                const now = dayjs().format("YYYY-M-D-H");

                const 用户: MemberData = {
                    联军贡献: 0,
                    加入时间: now,
                };

                const 新联军数据: Omit<CoalitionArmy, "id"> = {
                    联军编号: 新联军编号,
                    联军元首: uid,
                    联军总理: uid,
                    联军一级权限成员列表: [uid],
                    联军二级权限成员列表: [],
                    联军三级权限成员列表: [],
                    联军政治体制: 联军政体.极权制,
                    联军税率: 0,
                    联军成员数量: 1,
                    联军成员列表: { [uid]: 用户 },
                    联军首都: 新地区,
                    联军地区列表: [新地区],
                    联军军队: 0,
                    联军生活资料: 0,
                    联军宣称人口: 0,
                    联军宣称兵力: 0,
                    联军名称: 规范联军名称,
                    名称是否审核: false,
                    建立日期: now,
                    上次改名日期: now,
                };

                await Promise.all([
                    ctx.database.set(
                        "马列联军表",
                        { id: 新联军ID },
                        新联军数据,
                    ),
                    ctx.database.set(
                        "马列玩家表",
                        { id },
                        {
                            所在联军: 新联军编号,
                            驻扎地区: 新地区,
                        },
                    ),
                ]);

                return `
====[征战文游]====
联军组建成功！
□ 联军名称: ***
□ 联军编号: ${新联军编号}

分配的地区: ${新地区}
`.trim();
            } catch (error) {
                if (新联军ID !== null) {
                    try {
                        await ctx.database.remove("马列联军表", {
                            id: 新联军ID,
                        });
                    } catch {}
                }

                if (新地区) {
                    try {
                        await ctx.database.set(
                            "马列地区状态机",
                            { 地区编号: 新地区 },
                            {
                                地区归属国: null,
                                是否已分配: false,
                            } as any,
                        );
                    } catch {}
                }

                return (error as Error).message;
            }
        });
}
