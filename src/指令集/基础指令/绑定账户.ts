import { Context } from 'koishi'
import { } from 'koishi-plugin-cache-memory'
import { 用户检查 , 玩家检查 } from '../../Utils'



interface BindTask {
  ownerId: number;
  targetPlatform: string;
  targetUserId: string;
  timer: NodeJS.Timeout;
}

const 绑定任务池 = new Map<string, BindTask>();

export function 绑定账户(ctx: Context) {
    ctx.command('绑定账户' , '获取一个跨平台绑定令牌来绑定账号')
        .action(async ({ session }) => {
            try {
                const { id } = await 玩家检查(ctx, session);

                // 1. 清理过期任务池
                for (const [code, task] of 绑定任务池.entries()) {
                    if (task.ownerId === id) {
                        clearTimeout(task.timer);
                        绑定任务池.delete(code);
                    }
                }

                // 2. 生成 6 位随机码
                const code = Math.floor(100000 + Math.random() * 900000).toString();

                // 3. 存入内存，5 分钟后自动删除
                const timer = setTimeout(() => 绑定任务池.delete(code), 5 * 60 * 1000);
                绑定任务池.set(code, { ownerId: id, targetPlatform: '', targetUserId: '', timer });

                return `[安全令牌] 您的验证码为：${code}\n请在 5 分钟内前往新平台输入 [/确认绑定 ${code}]`;

            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('确认绑定 <code:string>')
        .action(async ({ session }, code) => {
            try {
                const task = 绑定任务池.get(code);
                if (!task) return '验证码无效或已过期';

                const { platform, userId } = 用户检查(session);

                // 检查这个 Discord 号是不是已经绑了别人
                const [existing] = await ctx.database.get( 'malieplayerconfig', { [platform]: userId } );
                if (existing) return '此社交账号已有关联角色，无法重复绑定';

                // 记录下目标信息
                task.targetPlatform = platform;
                task.targetUserId = userId;

                return `[申请成功] 已锁定目标账号。请回到【原平台账号】输入 [/最终同意] 完成绑定。`;
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('最终同意')
        .action(async ({ session }) => {
            const { id } = await 玩家检查(ctx, session);

            // 在池子里找“属于我”且“对方已填好信息”的任务
            const entry = Array.from(绑定任务池.entries()).find(([_, t]) =>
                t.ownerId === id && t.targetUserId !== ''
            );

            if (!entry) return '当前没有待确认的绑定申请。';
            const [code, task] = entry;

            try {
                // 写入数据库对应的平台字段
                await ctx.database.set('malieplayerconfig', task.ownerId, {[task.targetPlatform]: task.targetUserId} );

                // 清理定时器和内存
                clearTimeout(task.timer);
                绑定任务池.delete(code);

                return `[双向握手成功] 账号互通已完成！`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
