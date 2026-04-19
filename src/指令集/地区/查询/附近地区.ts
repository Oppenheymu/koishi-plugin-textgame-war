import type { Context } from 'koishi';
import {
    地区解析,
    当前地区解析,
    获取相邻地区,
    格式化距离,
    计算方向,
    格式化经纬度,
    地区编号转经纬度,
} from '@/utils';

export function 查看附近地区(ctx: Context) {
    ctx.command('附近地区 [地区编号:string]')
        .alias('附近')
        .alias('周边')
        .action(async ({ session }, 地区编号参数) => {
            try {
                const 规范地区编号 = 地区编号参数?.trim();
                const { 地区编号, 地区资料, 展示地区名称 } = 规范地区编号
                    ? await 地区解析(ctx, 规范地区编号)
                    : await 当前地区解析(ctx, session);

                const 经纬度 = 地区编号转经纬度(地区编号);
                const 邻居列表 = await 获取相邻地区(ctx, 地区编号);

                const 邻居行 = 邻居列表
                    .slice(0, 8)
                    .map(({ 地区编号: 编号, 距离 }) => {
                        const 方向 = 计算方向(
                            { gridX: 地区资料.栅格X, gridY: 地区资料.栅格Y },
                            {
                                gridX: Math.floor(parseInt(编号) / 100),
                                gridY: parseInt(编号) % 100,
                            }
                        );
                        return `  ${方向} ${编号} — ${格式化距离(距离)}`;
                    });

                return [
                    '【附近地区】',
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 坐标：(${地区资料.栅格X}, ${地区资料.栅格Y}) ${格式化经纬度(经纬度)}`,
                    '■ 相邻地区：',
                    ...邻居行,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
