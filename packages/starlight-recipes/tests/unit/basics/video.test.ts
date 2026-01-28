import { describe, expect, test, vi } from "vitest";

import { fetchYouTubeVideoMetadata } from "../../../libs/video";

const mockGetVideo = vi.hoisted(() => vi.fn());

vi.mock("youtube-sr", () => ({
  YouTube: {
    getVideo: mockGetVideo,
  },
}));

describe("fetchYouTubeVideoMetadata", () => {
  test("returns mapped metadata when the video is found", async () => {
    mockGetVideo.mockResolvedValue({
      id: "abc123",
      title: "Test Video",
      description: "Video description",
      uploadedAt: "2024-01-01T00:00:00.000Z",
      thumbnail: { url: "https://example.com/thumb.jpg" },
      duration: 120000,
      views: 42,
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

    mockGetVideo.mockRejectedValue(error);

    const result = await fetchYouTubeVideoMetadata(
      "https://youtube.com/watch?v=missing"
    );

    expect(result).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

