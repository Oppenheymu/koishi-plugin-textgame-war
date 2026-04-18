import type { Context } from 'koishi';
import { Logger } from 'koishi';
import { 地区查询权限检查 } from '@/utils';
import { 特殊建筑库 } from '../../建筑/config';

const logger = new Logger('菌毒种库查询');

export function 查看地区生物实验室(ctx: Context) {
    ctx.command('查看地区生物实验室 [地区编号:string]')
        .alias('查看城市生物实验室')
        .alias('生物实验室')
        .alias('菌毒种库')
        .alias('地区生物实验室')
        .alias('城市生物实验室')
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { 地区编号, 地区战略资料, 展示地区名称 } =
                    await 地区查询权限检查(
                        ctx,
                        session,
                        '查看地区生物实验室',
                        地区编号参数
                    );

                const 实验室列表 = Object.entries(
                    地区战略资料.生物实验室 ?? {}
                );

                logger.debug(
                    `[查询数据] 地区: ${地区编号}, 原始数据:`,
                    地区战略资料.生物实验室,
                    `实验室数量: ${实验室列表.length}`
                );

                const 建造需求 = 特殊建筑库.生物实验室.生产力需求;

                const 实验室展示 = 实验室列表.length
                    ? 实验室列表
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([编号, 实验室信息]) => {
                              const 最近日志 =
                                  (实验室信息.日志 ?? [])
                                      .slice(0, 2)
                                      .map(
                                          (日志) =>
                                              `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} x${日志.数量}`
                                      )
                                      .join('\n') || '      · 暂无制备记录';

                              const 百分比 = (
                                  (实验室信息.建造进度 / 建造需求) *
                                  100
                              ).toFixed(1);
                              return [
                                  `  - 实验室#${编号}`,
                                  `    · 状态：${实验室信息.是否制备中 ? '制备中' : '空闲'}`,
                                  `    · 建造进度：${百分比}%`,
                                  `    · 建造时间：${实验室信息.建造时间 || '未记录'}`,
                                  '    · 最近制备：',
                                  最近日志,
                              ].join('\n');
                          })
                          .join('\n')
                    : '  - 暂无生物实验室';

                return [
                    '【地区生物实验室】',
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || '暂无'}`,
                    `■ 实验室数量：${实验室列表.length}`,
                    '□ 实验室详情：',
                    实验室展示,
                ].join('\n');
            } catch (error) {
                logger.error(`[查询错误]:`, error);
                return (error as Error).message;
            }
        });
}
