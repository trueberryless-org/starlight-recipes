import ytdl from "@distube/ytdl-core";
import { z } from "astro/zod";
import matter from "gray-matter";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { secondsToIsoDuration } from "./time";

export const processedVideoSchema = z.object({
  name: z.string(),
  thumbnailUrl: z.array(z.string()).min(1),
  uploadDate: z.string(),
  description: z.string().optional(),
  duration: z.string().optional(),
  embedUrl: z.string().url().optional(),
  userInteractionCount: z.number().nonnegative().optional(),
});

export type ProcessedVideo = z.infer<typeof processedVideoSchema>;

export interface VideoFrontmatterProcessed extends ProcessedVideo {
  url: string;
}

export type VideoFrontmatter = VideoFrontmatterProcessed | undefined;

export async function fetchYouTubeVideoMetadata(
  url: string
): Promise<VideoFrontmatterProcessed | undefined> {
  try {
    const info = await ytdl.getBasicInfo(url);
    const details = info?.videoDetails;

    if (!details?.videoId) {
      throw new Error(`Missing video details for URL: ${url}`);
    }

    const thumbnails = Array.isArray(details.thumbnails)
      ? [...details.thumbnails]
      : [];

    thumbnails.sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

    const thumbnailUrl = thumbnails
      .filter((t) => typeof t.url === "string")
      .slice(0, 3)
      .map((t) => t.url as string);

    if (thumbnailUrl.length === 0) {
      // Without at least one thumbnail, we can’t satisfy required fields.
      throw new Error(`No thumbnails for YouTube URL: ${url}`);
    }

    const durationInSeconds =
      Number.parseInt(details.lengthSeconds ?? "0", 10) || 0;

    const processed: VideoFrontmatterProcessed = {
      url,
      name: details.title ?? "Untitled video",
      thumbnailUrl,
      uploadDate: details.publishDate ?? new Date().toISOString(),
      description: details.description ?? undefined,
      duration: durationInSeconds
        ? secondsToIsoDuration(durationInSeconds)
        : undefined,
      embedUrl: `https://www.youtube.com/embed/${details.videoId}`,
      userInteractionCount: details.viewCount
        ? Number.parseInt(details.viewCount, 10) || undefined
        : undefined,
    };

    processedVideoSchema.parse(processed);

    return processed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Failed to fetch YouTube metadata for ${url}. Details: ${message}`
    );
    return undefined;
  }
}

export function rewriteVideoFieldInFrontmatter(
  raw: string,
  video: VideoFrontmatterProcessed
): string {
  const parsed = matter(raw);
  const data = parsed.data ?? {};

  if (!Object.prototype.hasOwnProperty.call(data, "video")) {
    return raw;
  }

  const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n(---|\.\.\.)\s*\r?\n?/;
  const fmMatch = raw.match(frontmatterRegex);
  if (!fmMatch) {
    return raw;
  }

  const fmBody = fmMatch[1] ?? "";
  const closingDelimiter = fmMatch[2] ?? "---";

  const videoLineRegex = /^(?<indent>\s*)video\s*:\s*.*$/m;
  const match = fmBody.match(videoLineRegex);
  if (!match || !match.groups) {
    return raw;
  }

  const indent = match.groups.indent ?? "";

  const lines: string[] = [
    `${indent}video:`,
    `${indent}  url: ${JSON.stringify(video.url)}`,
    `${indent}  name: ${JSON.stringify(video.name)}`,
    `${indent}  thumbnailUrl:`,
    ...video.thumbnailUrl.map(
      (thumb) => `${indent}    - ${JSON.stringify(thumb)}`
    ),
    `${indent}  uploadDate: ${JSON.stringify(video.uploadDate)}`,
  ];

  if (video.description) {
    lines.push(`${indent}  description: ${JSON.stringify(video.description)}`);
  }
  if (video.duration) {
    lines.push(`${indent}  duration: ${JSON.stringify(video.duration)}`);
  }
  if (video.embedUrl) {
    lines.push(`${indent}  embedUrl: ${JSON.stringify(video.embedUrl)}`);
  }
  if (typeof video.userInteractionCount === "number") {
    lines.push(
      `${indent}  userInteractionCount: ${video.userInteractionCount}`
    );
  }

  const newFmBody = fmBody.replace(videoLineRegex, lines.join("\n"));
  const newMatter = `---\n${newFmBody}\n${closingDelimiter}\n`;

  const updated = raw.replace(frontmatterRegex, newMatter);
  return updated;
}

export async function normalizeVideoInFile(filePath: string): Promise<void> {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = matter(raw);

  const current = parsed.data.video as
    | string
    | VideoFrontmatterProcessed
    | undefined;

  if (!current) {
    return;
  }

  if (typeof current === "object" && current !== null) {
    try {
      processedVideoSchema.parse(current);
      return;
    } catch {}
  }

  const url = typeof current === "string" ? current : current.url;
  if (!url) return;

  const processed = await fetchYouTubeVideoMetadata(url);
  if (!processed) {
    return;
  }

  const updated = rewriteVideoFieldInFrontmatter(raw, processed);
  if (updated === raw) {
    return;
  }

  writeFileSync(filePath, updated, "utf-8");
}

export async function preprocessRecipeVideos(options: {
  srcDir: string;
  prefix: string;
  locales?: string[];
}): Promise<void> {
  const baseDocsDir = join(options.srcDir, "content", "docs");
  const localeKeys =
    options.locales && options.locales.length > 0 ? options.locales : ["root"];

  for (const locale of localeKeys) {
    const docsDir =
      locale === "root"
        ? join(baseDocsDir, options.prefix)
        : join(baseDocsDir, locale, options.prefix);

    let stats;
    try {
      stats = statSync(docsDir);
    } catch {
      continue;
    }

    if (!stats.isDirectory()) {
      continue;
    }

    const files = collectMarkdownFiles(docsDir);

    for (const filePath of files) {
      await normalizeVideoInFile(filePath);
    }
  }
}

function collectMarkdownFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectMarkdownFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
    ) {
      result.push(fullPath);
    }
  }

  return result;
}
