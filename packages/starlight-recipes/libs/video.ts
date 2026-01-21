import { type Video, YouTube } from "youtube-sr";

import { secondsToIsoDuration } from "./time";

export const fetchYouTubeVideoMetadata = async (
  url: string
): Promise<YouTubeVideoMetadata> => {
  const video = await YouTube.getVideo(url);
  return mapVideoToSchema(video);
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
  thumbnailUrl: string[];
  uploadDate: string;
  duration: string;
  embedUrl: string;
  description: string;
  userInteractionCount: number;
}
