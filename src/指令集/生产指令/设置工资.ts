import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";

export function 设置工资(ctx: Context) {
    ctx.command('设置工资 <工资:number>')
        .action(async ({ session }, 工资) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;

                // 验证工资输入
                if (工资 === undefined || 工资 === null) {
                    return `请输入要设置的工资数额\n例如：\`设置工资 5\``;
                }

                // 检查工资是否为整数
                if (!Number.isInteger(工资)) {
                    return `工资必须是整数！`;
                }

                // 检查工资范围
                if (工资 < 0 || 工资 > 用户资料.生产技术) {
                    return `
【设置工资】
${username} 同志：
□ 工资不符合要求
□ 有效范围：0 ~ ${用户资料.生产技术}
□ 您设置的值：${工资}
`.trim();
                }

                // 更新工资
                await ctx.database.set('malieplayer', { userId: userId }, {
                    工人工资: 工资
                });

                const 最低工资 = Math.floor(用户资料.生产技术 / 2);
                const 工资状态 = 工资 >= 最低工资 ? '✓ 稳定' : '✗ 不稳定';

                return `
【设置工资】
${username} 同志：
===工资设置成功===
■ 当前工资：${工资}
■ 最低工资：${最低工资}
■ 状态：${工资状态}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
