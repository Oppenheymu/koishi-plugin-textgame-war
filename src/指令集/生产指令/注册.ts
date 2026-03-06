
import { Context } from 'koishi';
import Hashids from 'hashids'
import { Player } from '../../Types/index';
import { 用户检查 , TRandom } from "../../Utils/index";

const hashids = new Hashids("我的的神秘盐值-天机不可泄露", 6, "1234567890ABCDEF");
const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 注册(ctx: Context) {
    ctx.command('注册', '注册账号，开始你的冒险之旅！')
        .action(async ({ session }) => {
            try {

                const { platform, userId } = await 用户检查(session);
                const [ifExisting] = await ctx.database.get('malieplayerconfig', { [platform]: userId } );
                if ( ifExisting ) throw new Error(`同志，你已经注册过了`);

                const newPlayerConfig = await ctx.database.create('malieplayerconfig', { [platform]: userId , username: '默认名称' } );
                const newID = newPlayerConfig.id;
                const newUID = hashids.encode(newID);
                const username = newPlayerConfig.username;

                await ctx.database.set('malieplayerconfig', newID , { uid: newUID });

                const 初始工人 = TRandom(4000, 12000, 16000);
                const 初始生活资料 = TRandom(8000, 50000, 90000);
                const 初始石油 = TRandom(500, 1500, 8000);
                const 初始钢铁 = TRandom(10000, 20000, 50000);
                const 战争保护期时长 = TRandom(3, 7, 15);
                const 初始防空弹药 = TRandom(3000, 10000, 20000);

                const newPlayerData: Player = {
                    id: newID,
                    uid: newUID,
                    驻扎地区: null,
                    战争保护期: ( Date.now() + 战争保护期时长 * 24 * 60 * 60 * 1000 ),
                    今日是否签到: true,
                    小时是否生产: false,
                    稳定度: 80,
                    生产次数: 1,
                    工人工资: 5,
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
                    铁矿石: 0,
                    钢铁: 初始钢铁,
                    私人军队: 0,
                    重炮: 0,
                    火箭炮: 0,
                    火箭炮弹药: 0,
                    防空弹药: 初始防空弹药,
                    飞机: 0,
                    隐形飞机: 0,
                    预警机: 0,
                    大型运输机: 0,
                    小型运输机: 0,
                    战斗机: 0,
                    巡航中的战斗机: 0,
                    地下飞机: 0,
                    地下隐形飞机: 0,
                    地下预警机: 0,
                    地下大型运输机: 0,
                    地下小型运输机: 0,
                    地下火箭炮炮弹: 0,
                    地下防空弹药: 0,
                }

                await ctx.database.create('malieplayer', newPlayerData);

                return `
====[征战文游]====
${username} 同志 注册成功
□ 新玩家注册奖励:
■ 工人：${格式化(初始工人)}
■ 钢铁：${格式化(初始钢铁)}
■ 石油：${格式化(初始石油)}
■ 生活资料：${格式化(初始生活资料)}

□新手战争保护期：${战争保护期时长}天
发送[帮助]查看指令表
发送[词典]查看设定
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
