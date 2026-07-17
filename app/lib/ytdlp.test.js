import { describe, expect, it } from "vitest";
import {
  buildResult, cookieArgs, formatSelector, humanDuration, humanSize,
  humanViews, isValidUrl, safeName,
} from "./ytdlp";

describe("isValidUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "http://youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtu.be/aqz-KE-bpKQ",
    "https://vimeo.com/76979871",
    "https://www.tiktok.com/@scout2015/video/6718335390845095173",
    "https://www.instagram.com/reel/example/",
  ])("accepts a supported public video URL: %s", (url) => {
    expect(isValidUrl(url)).toBe(true);
  });

  it.each([
    "http://127.0.0.1:3000/",
    "http://localhost/admin",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/",
    "https://example.com/video",
    "https://user:password@youtube.com/watch?v=test",
    "https://youtube.com:8443/watch?v=test",
    "file:///etc/passwd",
    "not a url",
    null,
    `https://youtube.com/${"x".repeat(2100)}`,
  ])("rejects an unsafe or unsupported URL: %s", (url) => {
    expect(isValidUrl(url)).toBe(false);
  });
});

describe("formatting helpers", () => {
  it("formats sizes, durations, views, selectors, and safe filenames", () => {
    expect(humanSize(0)).toBeNull();
    expect(humanSize(1024 * 1024)).toBe("1.0 MB");
    expect(humanSize(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
    expect(humanDuration(undefined)).toBe("");
    expect(humanDuration(65)).toBe("1:05");
    expect(humanDuration(3661)).toBe("1:01:01");
    expect(humanViews(1234, "en")).toBe("1,234 views");
    expect(humanViews(1234, "zh")).toBe("1,234 次观看");
    expect(humanViews(undefined, "en")).toBe("");
    expect(formatSelector("mp3")).toBeNull();
    expect(formatSelector("720")).toContain("height<=720");
    expect(formatSelector("bad")).toBe("bv*+ba/b");
    expect(safeName("  bad/name\u0000  title  ")).toBe("badname title");
    expect(safeName("***")).toBe("video");
  });

  it("only supplies cookie args for an existing configured file", () => {
    const previous = process.env.YT_DLP_COOKIES;
    process.env.YT_DLP_COOKIES = `${process.cwd()}/package.json`;
    expect(cookieArgs()).toEqual(["--cookies", process.env.YT_DLP_COOKIES]);
    process.env.YT_DLP_COOKIES = "/definitely/missing/cookies.txt";
    expect(cookieArgs()).toEqual([]);
    if (previous === undefined) delete process.env.YT_DLP_COOKIES;
    else process.env.YT_DLP_COOKIES = previous;
  });
});

describe("buildResult", () => {
  it("builds deduplicated video tiers and audio metadata", () => {
    const result = buildResult({
      title: "Public demo", uploader: "Example", view_count: 10,
      duration: 60, extractor_key: "Youtube", thumbnail: "https://img.example/x.jpg",
      webpage_url: "https://youtube.com/watch?v=demo",
      formats: [
        { vcodec: "none", acodec: "aac", abr: 128, filesize: 1_000_000 },
        { vcodec: "h264", acodec: "none", height: 1080, tbr: 2000, filesize: 10_000_000 },
        { vcodec: "h264", acodec: "aac", height: 720, tbr: 1000, filesize_approx: 5_000_000 },
        { vcodec: "h264", acodec: "aac", height: 360, tbr: 500 },
      ],
    });
    expect(result.source).toBe("YouTube");
    expect(result.duration).toBe("1:00");
    expect(result.author).toBe("Example");
    expect(result.formats.map((f) => f.quality)).toEqual(["1080p", "720p", "360p", "MP3"]);
    expect(result.formats[0].size).toBe("10.5 MB");
  });

  it("uses safe fallbacks for sparse metadata", () => {
    const result = buildResult({ id: "id-only", extractor: "CustomSite", formats: [] }, "zh");
    expect(result.title).toBe("id-only");
    expect(result.source).toBe("Custom Site");
    expect(result.formats).toEqual([expect.objectContaining({ quality: "MP3", size: "—" })]);
  });

  it("uses channel and original URL fallbacks", () => {
    const result = buildResult({
      title: "Fallbacks", channel: "Channel", view_count: 0, duration: 0,
      extractor_key: "Dailymotion", original_url: "https://dailymotion.com/video/demo",
      formats: [],
    });
    expect(result).toMatchObject({ author: "Channel", views: "0 views", webpageUrl: "https://dailymotion.com/video/demo" });
  });
});
