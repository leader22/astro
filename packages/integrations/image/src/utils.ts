import fs from 'fs';
import path from 'path';
import { shorthash } from './shorthash.js';
import type { OutputFormat, TransformOptions } from './types';

export function isOutputFormat(value: string): value is OutputFormat {
	return ['avif', 'jpeg', 'png', 'webp'].includes(value);
}

export function isAspectRatioString(value: string): value is `${number}:${number}` {
	return /^\d*:\d*$/.test(value);
}

export function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

export function isRemoteImage(src: string) {
	return /^http(s?):\/\//.test(src);
}

export async function loadLocalImage(src: string) {
	try {
		return await fs.promises.readFile(src);
	} catch {
		return undefined;
	}
}

export async function loadRemoteImage(src: string) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch {
		return undefined;
	}
}

export async function loadImage(src: string) {
	return isRemoteImage(src) ? await loadRemoteImage(src) : await loadLocalImage(src);
}

export function propsToFilename({ src, width, height, format }: TransformOptions) {
	const ext = path.extname(src);
	let filename = src.replace(ext, '');

	// for remote images, add a hash of the full URL to dedupe images with the same filename
	if (isRemoteImage(src)) {
		filename += `-${shorthash(src)}`;
	}

	if (width && height) {
		return `${filename}_${width}x${height}.${format}`;
	} else if (width) {
		return `${filename}_${width}w.${format}`;
	} else if (height) {
		return `${filename}_${height}h.${format}`;
	}

	return format ? src.replace(ext, format) : src;
}

export function parseAspectRatio(aspectRatio: TransformOptions['aspectRatio']) {
	if (!aspectRatio) {
		return undefined;
	}

	// parse aspect ratio strings, if required (ex: "16:9")
	if (typeof aspectRatio === 'number') {
		return aspectRatio;
	} else {
		const [width, height] = aspectRatio.split(':');
		return parseInt(width) / parseInt(height);
	}
}
