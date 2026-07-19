import type { Context } from 'koishi';
import { 会话检查 } from '#/utils';

export function 地区洗牌(ctx: Context) {
    ctx.command('地区洗牌', {
        authority: 4,
    }).action(async ({ session }) => {
        会话检查(session);

        await session.send('准备为地区洗牌，请稍候...');

        try {
            // 1. 获取数据
            const 所有陆地 = await ctx.database.get(
                '马列地区地形表',
                {
                    是否为海洋: false,
                },
                ['地区编号']
            );

            if (所有陆地.length === 0) return '错误：地形表中没有找到陆地数据，请先生成地形！';

            const 陆地编号列表 = 所有陆地.map((地形) => 地形.地区编号);
            const 陆地总数 = 陆地编号列表.length;

            await session.send(`已找到 ${陆地总数} 处陆地，开始进行洗牌...`);

            // 2. 核心洗牌算法 (Fisher-Yates)
            for (let 倒序索引 = 陆地编号列表.length - 1; 倒序索引 > 0; 倒序索引--) {
                const 随机索引 = Math.floor(Math.random() * (倒序索引 + 1));
                // 交换元素
                [陆地编号列表[倒序索引], 陆地编号列表[随机索引]] = [
                    陆地编号列表[随机索引],
                    陆地编号列表[倒序索引],
                ];
            }

            // 3. 重置数据库状态
            await ctx.database.remove('马列地区洗牌池', {});
            await ctx.database.upsert('马列服务表', [
                {
                    id: 'GLOBAL',
                    当前地区洗牌指针: 0,
                },
            ]);

            // 4. 分块写入数据库并同步重置地区状态机
            const 分块大小 = 1000;
            for (let 当前进度 = 0; 当前进度 < 陆地编号列表.length; 当前进度 += 分块大小) {
                const 当前块编号列表 = 陆地编号列表.slice(当前进度, 当前进度 + 分块大小);

                const 洗牌池数据块 = 当前块编号列表.map((编号, 块内索引) => ({
                    id: 当前进度 + 块内索引,
                    地区编号: 编号,
                }));

                const 状态机数据块 = 当前块编号列表.map((编号) => ({
                    地区编号: 编号,
                    地区归属国: null,
                    是否已分配: false,
                }));

                await Promise.all([
                    ctx.database.upsert('马列地区洗牌池', 洗牌池数据块),
                    ctx.database.upsert('马列地区状态机', 状态机数据块, ['地区编号']),
                ]);

                // 计算并发送进度
                const 已处理数量 = Math.min(当前进度 + 分块大小, 陆地总数);
                await session.send(`进度：${已处理数量} / ${陆地总数}`);
            }

            return `洗牌完成。已准备好 ${陆地总数} 个随机地区供玩家领取。`;
        } catch (error) {
            ctx.logger('地区洗牌').error(error);
            return '洗牌过程中发生内部错误，请检查后台日志。';
        }
    });
}
