import ytdl from "@distube/ytdl-core";

import { secondsToIsoDuration } from "./time";

export const fetchYouTubeVideoMetadata = async (
  url: string
): Promise<YouTubeVideoMetadata | undefined> => {
  try {
    const info = await ytdl.getBasicInfo(url);

    if (!info) {
      throw new Error(`No video found at the provided URL: ${url}`);
    }

    return mapVideoToSchema(info.videoDetails);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `Failed to fetch YouTube metadata for ${url}. Details: ${errorMessage}`
    );

    return undefined;
  }
};

const mapVideoToSchema = (video: any): YouTubeVideoMetadata => {
  const videoId = video.videoId ?? "";

  const durationInSeconds = parseInt(video.lengthSeconds ?? "0");

  return {
    name: video.title ?? "Unknown Title",
    description: video.description ?? "",
    uploadDate: video.publishDate ?? new Date().toISOString(),
    thumbnailUrl: video.thumbnails?.length ? [video.thumbnails[0].url] : [],
    duration: secondsToIsoDuration(durationInSeconds),
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    userInteractionCount: parseInt(video.viewCount ?? "0"),
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
