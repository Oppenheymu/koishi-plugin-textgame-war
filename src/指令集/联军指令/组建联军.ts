//src/commandC/Buildcountry.ts

import { Context } from "koishi";
import dayjs from 'dayjs';
import Sqids from 'sqids';
import {} from "koishi-plugin-am-i-alt";
import { CoalitionArmy , 联军政体 } from "../../Types";
import { 分配坐标逻辑, 玩家检查 } from "../../Utils/";



const sqids = new Sqids({
  alphabet: '9087564312',
  minLength: 5,
  blocklist: new Set([])
});

export function 组建联军(ctx: Context) {
    ctx.command("组建联军 <联军名称:string>").alias('组建国家').alias("创建国家").alias("建国")
        .action( async ( { session }, 联军名称 ) => {
            try {

                const { uid, username, 用户资料 } = await 玩家检查(ctx, session);

                if ((await ctx.amIAlt.isAlt(session)) == true) return "疑似小号禁止组建联军";

                if ( !联军名称 ) {
                    return `
=====[国家]=====
${username} 同志！
请提供国家名称。
如：组建国家 共和国
`.trim()
                }

                if ( 联军名称.length < 2 || 联军名称.length > 12 ) {
        return `
=====[国家]=====
${username} 同志！
国名须在2到12字符间
`.trim()
                }

                const 合法字符 = /^[\u4e00-\u9fa5]+$/;
                if (!合法字符.test(联军名称)) {
                    return `
======[国家]=====
${username} 同志！
国家名称只能包含中文。
`.trim();
                }

                const 新联军配置 = await ctx.database.create(
                    "马列联军表",
                    { },
                );

                const 新联军ID = 新联军配置.id
                const 新联军编号 = sqids.encode([新联军ID]);

                const 新地区 = await 分配坐标逻辑(ctx, 新联军ID);

                const now = dayjs().format('YYYY-M-D-H');

                const 新联军数据: CoalitionArmy = {
                    id: 新联军ID,
                    联军编号: 新联军编号,
                    联军元首: uid,
                    联军总理: uid,
                    联军一级权限成员列表: [ uid ],
                    联军二级权限成员列表: [],
                    联军三级权限成员列表: [],
                    联军政治体制: 联军政体.极权制 ,
                    联军税率: 0,
                    联军成员数量: 1,
                    联军成员列表: [ uid ],
                    联军首都: 新地区,
                    联军地区列表: [ 新地区 ],
                    联军生活资料: 0,
                    联军宣称人口: 0,
                    联军宣称兵力: 0,
                    联军名称: 联军名称,
                    名称是否审核: false,
                    建立日期: now
                }

                await ctx.database.set('马列联军表', { id: 新联军ID }, 新联军数据)

                return `
====[征战文游]====
联军组建成功！
□ 联军编号: ${新联军编号}
□ 联军元首: ${uid}

分配的地区: ${新地区}
`.trim();


            } catch (error) {
                return (error as Error).message;
            }
        });
}
