import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { h, Logger } from "koishi";
import { 查找项目根目录 } from "./图片目录查找";

const logger = new Logger("malie-random-image");

export function 生成随机图片片段(
	图片池: readonly string[],
	触发概率: number,
	资源子目录: readonly string[] = ["src", "assets", "Image"],
): string {
	if (!图片池.length) {
		logger.warn("图片池为空，跳过发送");
		return "";
	}

	if (触发概率 <= 0) {
		logger.warn(`触发概率 <= 0（${触发概率}），跳过发送`);
		return "";
	}

	const 最终概率 = Math.min(1, 触发概率);
	const 随机值 = Math.random();
	logger.warn(
		`开始判定：随机值=${随机值.toFixed(6)}，概率=${最终概率}，图片池数量=${
			图片池.length
		}`,
	);

	if (随机值 >= 最终概率) {
		logger.warn("未触发发送");
		return "";
	}

	const 随机图片 = 图片池[Math.floor(Math.random() * 图片池.length)];
	if (!随机图片) {
		logger.warn("未选中图片，跳过发送");
		return "";
	}

	logger.warn(`命中图片：${随机图片}`);

	const 当前文件目录 = dirname(fileURLToPath(import.meta.url));
	const 项目根目录 = 查找项目根目录(当前文件目录);

	const 图片路径候选 = [
		resolve(process.cwd(), ...资源子目录, 随机图片),
		resolve(项目根目录, ...资源子目录, 随机图片),
		resolve(项目根目录, "assets", "Image", 随机图片),
	];

	const 可用图片路径 = 图片路径候选.find((path) => existsSync(path));
	if (!可用图片路径) {
		logger.error(`未找到图片文件：${随机图片}`);
		logger.error(`路径候选：${图片路径候选.join(" | ")}`);
		return "";
	}

	const src = pathToFileURL(可用图片路径).href;
	logger.warn(`生成图片片段：${可用图片路径}`);
	logger.warn(`图片 src：${src}`);

	return h("img", {
		src,
	}).toString();
}
