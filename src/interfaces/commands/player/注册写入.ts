// 注册写入（清残档 / 语言选定 / 建号落库，注册指令的业务部分）
import type { Context, Session } from "koishi";
import { TRandom, 获取注册Sqids } from "#/infrastructure";
import { 检查名称是否重复 } from "#ctx/naming";
import type { 装备数量列 } from "#ctx/military";
import { 军队装备数量列名单 } from "#ctx/military";
import type { Player, PlayerConfig, PlayerWarData } from "#ctx/player";

/** 27 个装备数量列全零初始化 */
function 零装备数量列(): 装备数量列 {
    return Object.fromEntries(军队装备数量列名单.map((名) => [名, 0])) as 装备数量列;
}

/** 已有完整档案 → 返回 true 拦截重复注册；残档（缺表）→ 清掉重建 */
export async function 清理已有玩家档案(
    ctx: Context,
    platform: string,
    userId: string,
): Promise<boolean> {
    const [已有玩家配置] = await ctx.database.get("征战玩家配置表", {
        [platform]: userId,
    });
    if (!已有玩家配置) return false;

    const [已有玩家档案列表, 已有玩家战争档案列表] = await Promise.all([
        ctx.database.get("征战玩家表", { id: 已有玩家配置.id }),
        ctx.database.get("征战玩家战争表", { id: 已有玩家配置.id }),
    ]);

    if (已有玩家档案列表[0] && 已有玩家战争档案列表[0]) {
        return true;
    }

    await Promise.all([
        ctx.database.remove("征战玩家表", { id: 已有玩家配置.id }),
        ctx.database.remove("征战玩家战争表", { id: 已有玩家配置.id }),
        ctx.database.remove("征战玩家配置表", { id: 已有玩家配置.id }),
    ]);
    return false;
}

/** 注册时选定语言，写入 Koishi 用户档案后所有回复自动跟随；取消返回 false */
export async function 选定语言(session: Session): Promise<boolean> {
    await session.send("请选择你的语言 / Please choose your language:\n1. 中文\n2. English");
    const 语言选择 = await session.prompt();
    if (!语言选择) return false;
    const 语言列表 = /en|english|^2$/i.test(语言选择) ? ["en-US"] : ["zh-CN"];
    const koishi用户 = await session.observeUser(["locales"]);
    koishi用户.locales = 语言列表;
    await koishi用户.$update();
    return true;
}

export interface 注册初始资源 {
    工人: number;
    生活资料: number;
    石油: number;
    钢铁: number;
}

/** 建号落库（配置表 → 玩家表 → 战争表），失败回滚全部新写入 */
export async function 创建新玩家档案(
    ctx: Context,
    session: Session,
    platform: string,
    userId: string,
): Promise<{ 玩家ID: number; uid: string; username: string; 初始资源: 注册初始资源 }> {
    const 初始资源: 注册初始资源 = {
        工人: TRandom(4000, 12000, 16000),
        生活资料: TRandom(8000, 50000, 90000),
        石油: TRandom(50, 150, 800),
        钢铁: TRandom(100, 200, 500),
    };

    let newID = 0;
    try {
        const newPlayerConfig: PlayerConfig = await ctx.database.create("征战玩家配置表", {
            [platform]: userId,
            username: "",
            名称是否审核: true,
        });

        newID = newPlayerConfig.id;
        const newUID = 获取注册Sqids().encode([newID]);

        const 初始名称 =
            platform === "onebot" ? (session.username?.trim() ?? "") : `默认名称${newUID}`;
        let username = 初始名称 || `默认名称${newUID}`;

        const 重名类型 = await 检查名称是否重复(ctx, username, { 排除玩家ID: newID });
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
            生活资料: 初始资源.生活资料,
            生产技术: 10,
            厂房: 10000,
            工人: 初始资源.工人,
            地下工人: 0,
            休假工人: 0,
            科技等级: 1,
            科技蓝图: 0,
            科技池投入: 0,
            科技池容量: 3000,
            石油: 初始资源.石油,
            铝土矿: 0,
            金属铝: 0,
            铁矿石: 0,
            钢铁: 初始资源.钢铁,
            铀矿: 0,
            浓缩铀: 0,
            钚: 0,
            生物武器: 0,
        };

        const newPlayerWarData: PlayerWarData = {
            id: newID,
            uid: newUID,
            ...零装备数量列(),
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

        return { 玩家ID: newID, uid: newUID, username, 初始资源 };
    } catch (error) {
        if (newID) {
            await Promise.allSettled([
                ctx.database.remove("征战玩家表", { id: newID }),
                ctx.database.remove("征战玩家战争表", { id: newID }),
                ctx.database.remove("征战玩家配置表", { id: newID }),
            ]);
        }
        throw error;
    }
}
