import type { Context } from 'koishi';
import { 地区查询权限检查 } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 查看地区离心机组(ctx: Context) {
    ctx.command('查看地区离心机组 [地区编号:string]')
        .alias('查看城市离心机组')
        .alias('高速离心级联')
        .alias('地区离心机组')
        .alias('城市离心机组')
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { 地区编号, 地区战略资料, 展示地区名称 } =
                    await 地区查询权限检查(
                        ctx,
                        session,
                        '查看地区离心机组',
                        地区编号参数
                    );

                const 机组列表 = Object.entries(
                    地区战略资料.高速离心级联 ?? {}
                );

                const 机组展示 = 机组列表.length
                    ? 机组列表
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([编号, 机组]) => {
                              const 最近日志 =
                                  (机组.日志 ?? [])
                                      .slice(0, 3)
                                      .map(
                                          (日志) =>
                                              `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} × ${格式化(日志.数量)}`
                                      )
                                      .join('\n') || '      · 暂无制备记录';

                              return [
                                  `  - 离心机组#${编号}`,
                                  `    · 状态：${机组.是否运行中 ? '运行中' : '停机'}`,
                                  `    · 建造进度：${格式化(机组.建造进度)}%`,
                                  `    · 建造时间：${机组.建造时间 || '未知'}`,
                                  '    · 最近制备：',
                                  最近日志,
                              ].join('\n');
                          })
                          .join('\n')
                    : '  - 暂无离心机组记录';

                return [
                    '【地区高速离心级联】',
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || '暂无'}`,
                    `■ 机组数量：${机组列表.length}`,
                    '□ 机组详情：',
                    机组展示,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
