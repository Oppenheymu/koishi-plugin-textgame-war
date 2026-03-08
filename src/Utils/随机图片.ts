import { h, Session } from 'koishi';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function 尝试发送随机图片(
  session: Session | undefined,
  图片池: readonly string[],
  触发概率: number = 0.01,
  资源子目录: readonly string[] = ['src', 'assets', 'Image']
): Promise<void> {
  if (!session) return;
  if (!图片池.length) return;
  if (触发概率 <= 0) return;

  const 最终概率 = Math.min(1, 触发概率);
  if (Math.random() >= 最终概率) return;

  const 随机图片 = 图片池[Math.floor(Math.random() * 图片池.length)];
  if (!随机图片) return;

  const 图片路径 = resolve(process.cwd(), ...资源子目录, 随机图片);
  await session.send(h.image(pathToFileURL(图片路径).href));
}
