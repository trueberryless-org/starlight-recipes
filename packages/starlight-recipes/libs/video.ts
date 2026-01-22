import { type Video, YouTube } from "youtube-sr";

import { secondsToIsoDuration } from "./time";

export const fetchYouTubeVideoMetadata = async (
  url: string
): Promise<YouTubeVideoMetadata | undefined> => {
  try {
    const video = await YouTube.getVideo(url);

    if (!video) {
      throw new Error(`No video found at the provided URL: ${url}`);
    }

    return mapVideoToSchema(video);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `Failed to fetch YouTube metadata for ${url}. Details: ${errorMessage}`
    );

    return undefined;
  }
};

const mapVideoToSchema = (video: Video): YouTubeVideoMetadata => {
  const videoId = video.id ?? "";

  const rawDuration = video.duration ?? 0;
  const durationInSeconds = Math.floor(rawDuration / 1000);

  return {
    name: video.title ?? "Unknown Title",
    description: video.description ?? "",
    uploadDate: video.uploadedAt ?? new Date().toISOString(),
    thumbnailUrl: video.thumbnail?.url ? [video.thumbnail.url] : [],
    duration: secondsToIsoDuration(durationInSeconds),
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    userInteractionCount: video.views ?? 0,
  };
};

export interface YouTubeVideoMetadata {
  name: string;
  description: string;
  thumbnailUrl: string[];
  uploadDate: string;
  duration: string;
  embedUrl: string;
  userInteractionCount: number;
}
