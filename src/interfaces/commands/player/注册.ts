import type { Context } from "koishi";
import { TRandom, 获取注册Sqids } from "#/infrastructure";
import { 检查名称是否重复 } from "#ctx/naming";
import type { Player, PlayerConfig, PlayerWarData } from "#ctx/player";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";
import { 会话检查, 用户检查 } from "#shared/session";

const 文案 = {
    "already-registered": "同志，你已经注册过了（UID: {uid}）",
    reply: `{user} 同志 注册成功
□ 新玩家注册奖励:
■ 工人：{workers}
■ 钢铁：{steel}
■ 石油：{oil}
■ 生活资料：{supplies}

发送[帮助]查看指令表
发送[词典]查看设定`,
};

// 注册引导语：此时玩家语言未知，只能双语并列
const 语言引导 = "请选择你的语言 / Please choose your language:\n1. 中文\n2. English";
const 未选择语言 =
    "注册已取消（未选择语言），重新发送[注册]即可 / Registration cancelled, resend [注册] to retry";

export function 注册(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.register", 文案);

    ctx.command("注册")
        .alias("首次阅读报告")
        .action(async ({ session }) => {
            try {
                会话检查(session);
                用户检查(session);

                const platform = session.platform;
                const userId = session.userId;

                const [已有玩家配置] = await ctx.database.get("征战玩家配置表", {
                    [platform]: userId,
                });

                if (已有玩家配置) {
                    const [已有玩家档案列表, 已有玩家战争档案列表] = await Promise.all([
                        ctx.database.get("征战玩家表", {
                            id: 已有玩家配置.id,
                        }),
                        ctx.database.get("征战玩家战争表", {
                            id: 已有玩家配置.id,
                        }),
                    ]);

                    const [已有玩家档案] = 已有玩家档案列表;
                    const [已有玩家战争档案] = 已有玩家战争档案列表;

                    if (已有玩家档案 && 已有玩家战争档案) {
                        return session.text("textwar.register.already-registered", {
                            uid: 已有玩家配置.uid,
                        });
                    }

                    await Promise.all([
                        ctx.database.remove("征战玩家表", {
                            id: 已有玩家配置.id,
                        }),
                        ctx.database.remove("征战玩家战争表", {
                            id: 已有玩家配置.id,
                        }),
                        ctx.database.remove("征战玩家配置表", {
                            id: 已有玩家配置.id,
                        }),
                    ]);
                }

                // 注册时选定语言，写入 Koishi 用户档案后所有回复自动跟随
                await session.send(语言引导);
                const 语言选择 = await session.prompt();
                if (!语言选择) {
                    return 未选择语言;
                }
                const 语言列表 = /en|english|^2$/i.test(语言选择) ? ["en-US"] : ["zh-CN"];
                const koishi用户 = await session.observeUser(["locales"]);
                koishi用户.locales = 语言列表;
                await koishi用户.$update();

                let newID = 0;
                let newUID = "";
                let username = "";

                const 初始工人 = TRandom(4000, 12000, 16000);
                const 初始生活资料 = TRandom(8000, 50000, 90000);
                const 初始石油 = TRandom(50, 150, 800);
                const 初始钢铁 = TRandom(100, 200, 500);

                try {
                    const newPlayerConfig: PlayerConfig = await ctx.database.create(
                        "征战玩家配置表",
                        {
                            [platform]: userId,
                            username: "",
                            名称是否审核: true,
                        },
                    );

                    newID = newPlayerConfig.id;
                    newUID = 获取注册Sqids().encode([newID]);

                    const 初始名称 =
                        platform === "onebot"
                            ? (session.username?.trim() ?? "")
                            : `默认名称${newUID}`;

                    username = 初始名称 || `默认名称${newUID}`;

                    const 重名类型 = await 检查名称是否重复(ctx, username, {
                        排除玩家ID: newID,
                    });
                    if (重名类型) {
                        username = `默认名称${newUID}`;
                    }

                    await ctx.database.set("征战玩家配置表", newID, {
                        uid: newUID,
                        username,
                    });

                    const newPlayerData: Player = {
                        id: newID,
                        uid: newUID,
                        所在联军: null,
                        曾加入联军列表: [],
                        驻扎地区: null,
                        上次驻扎日期: "",
                        上次炮击时间: null,
                        战争保护期: null,
                        今日是否签到: true,
                        小时是否生产: false,
                        稳定度: 80,
                        生产次数: 1,
                        工人工资: 5,
                        工人招募限额: 1000,
                        生活资料: 初始生活资料,
                        生产技术: 10,
                        厂房: 10000,
                        工人: 初始工人,
                        地下工人: 0,
                        休假工人: 0,
                        科技等级: 1,
                        科技蓝图: 0,
                        科技池投入: 0,
                        科技池容量: 3000,
                        石油: 初始石油,
                        铝土矿: 0,
                        金属铝: 0,
                        铁矿石: 0,
                        钢铁: 初始钢铁,
                        铀矿: 0,
                        浓缩铀: 0,
                        钚: 0,
                        生物武器: 0,
                    };

                    const newPlayerWarData: PlayerWarData = {
                        id: newID,
                        uid: newUID,
                        步兵装备: 0,
                        卡车: 0,
                        两栖坦克: 0,
                        轻型坦克: 0,
                        中型坦克: 0,
                        重型坦克: 0,
                        现代坦克: 0,
                        装甲运兵车: 0,
                        两栖装甲运兵车: 0,
                        坦克歼击车: 0,
                        自行防空车: 0,
                        野战炮: 0,
                        火炮: 0,
                        火箭炮: 0,
                        列车炮: 0,
                        火箭弹: 0,
                        防空弹药: 0,
                        轻型航弹: 0,
                        重型航弹: 0,
                        侦察机: 0,
                        战斗机: 0,
                        预警机: 0,
                        战术轰炸机: 0,
                        战略轰炸机: 0,
                        隐形轰炸机: 0,
                        大型运输机: 0,
                        小型运输机: 0,
                        巡航中的预警机: 0,
                        巡航中的战斗机: 0,
                        地下工厂投入: 0,
                        是否有地下工厂: false,
                        地下机库投入: 0,
                        是否有地下机库: false,
                        地下弹药库投入: 0,
                        是否有地下弹药库: false,
                        地下侦察机: 0,
                        地下战斗机: 0,
                        地下预警机: 0,
                        地下战术轰炸机: 0,
                        地下战略轰炸机: 0,
                        地下隐形轰炸机: 0,
                        地下大型运输机: 0,
                        地下小型运输机: 0,
                        地下火箭弹: 0,
                        地下防空弹药: 0,
                    };

                    await Promise.all([
                        ctx.database.create("征战玩家表", newPlayerData),
                        ctx.database.create("征战玩家战争表", newPlayerWarData),
                    ]);
                } catch (error) {
                    if (newID) {
                        await Promise.allSettled([
                            ctx.database.remove("征战玩家表", {
                                id: newID,
                            }),
                            ctx.database.remove("征战玩家战争表", {
                                id: newID,
                            }),
                            ctx.database.remove("征战玩家配置表", {
                                id: newID,
                            }),
                        ]);
                    }
                    throw error;
                }

                return 带横幅回复(session, "textwar.register.reply", {
                    user: username,
                    workers: 格式化(初始工人),
                    steel: 格式化(初始钢铁),
                    oil: 格式化(初始石油),
                    supplies: 格式化(初始生活资料),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
