import { describe, expect, test, vi } from "vitest";

import { recipesSchema } from "../../../schema";
import { fetchYouTubeVideoMetadata } from "../../../libs/video";

const mockGetBasicInfo = vi.hoisted(() => vi.fn());

vi.mock("@distube/ytdl-core", () => ({
  default: {
    getBasicInfo: mockGetBasicInfo,
  },
}));

describe("fetchYouTubeVideoMetadata", () => {
  test("returns mapped metadata when the video is found", async () => {
    mockGetBasicInfo.mockResolvedValue({
      videoDetails: {
        videoId: "abc123",
        title: "Test Video",
        description: "Video description",
        publishDate: "2024-01-01T00:00:00.000Z",
        thumbnails: [{ url: "https://example.com/thumb.jpg" }],
        lengthSeconds: "120",
        viewCount: "42",
      },
    });

    const result = await fetchYouTubeVideoMetadata(
      "https://youtube.com/watch?v=abc123"
    );

    expect(result).toMatchObject({
      name: "Test Video",
      description: "Video description",
      thumbnailUrl: ["https://example.com/thumb.jpg"],
      embedUrl: "https://www.youtube.com/embed/abc123",
      userInteractionCount: 42,
    });
    expect(result?.duration).toBe("PT2M");
  });

  test("returns undefined and logs when fetching fails", async () => {
    const error = new Error("Request failed");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetBasicInfo.mockRejectedValue(error);

    const result = await fetchYouTubeVideoMetadata(
      "https://youtube.com/watch?v=missing"
    );

    expect(result).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  test("returns undefined and logs when video is not found", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetBasicInfo.mockResolvedValue(null);

    const result = await fetchYouTubeVideoMetadata(
      "https://youtube.com/watch?v=notfound"
    );

    expect(result).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Missing video details for URL: https://youtube.com/watch?v=notfound")
    );

    consoleError.mockRestore();
  });
});

describe("video frontmatter schema", () => {
  test("accepts legacy string URL form", () => {
    const schema = recipesSchema({
      // image function shape is provided by Astro at runtime; only type is important here
      image: (() => ({})) as any,
    });

    const result = schema.parse({
      video: "https://youtube.com/watch?v=abc123",
    });

    expect(result.video).toBe("https://youtube.com/watch?v=abc123");
  });

  test("accepts processed flattened object form", () => {
    const schema = recipesSchema({
      // image function shape is provided by Astro at runtime; only type is important here
      image: (() => ({})) as any,
    });

    const video = {
      url: "https://youtube.com/watch?v=abc123",
      name: "Test Video",
      description: "Video description",
      thumbnailUrl: ["https://example.com/thumb.jpg"],
      uploadDate: "2024-01-01T00:00:00.000Z",
      duration: "PT2M",
      embedUrl: "https://www.youtube.com/embed/abc123",
      userInteractionCount: 42,
    } as const;

    const result = schema.parse({
      video,
    });

    expect(result.video).toEqual(video);
  });
});
