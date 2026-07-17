import { NextResponse } from "next/server";
import { fetchInfo, buildResult, isValidUrl } from "@/app/lib/ytdlp";
import { rateLimit } from "@/app/lib/ratelimit";
import { LIMITS, clientIp } from "@/app/lib/limits";
import { acquireSlot } from "@/app/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(`parse:${ip}`, LIMITS.parse);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 4096) {
      return NextResponse.json({ error: "request_too_large" }, { status: 413 });
    }
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const url = (body?.url || "").trim();
  const lang = body?.lang === "zh" ? "zh" : "en";

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  let release;
  try {
    release = await acquireSlot({ signal: req.signal, timeoutMs: 10_000 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.code === "aborted" ? "aborted" : "busy" },
      { status: e?.code === "aborted" ? 499 : 503, headers: { "Retry-After": "10" } }
    );
  }

  try {
    const info = await fetchInfo(url, { signal: req.signal });

    // Enforce the duration cap early so the UI can't offer an oversized job.
    if (info.duration && info.duration > LIMITS.maxDurationSec) {
      return NextResponse.json(
        { error: "too_long", maxDurationSec: LIMITS.maxDurationSec },
        { status: 413 }
      );
    }

    const result = buildResult(info, lang);
    return NextResponse.json(result);
  } catch (e) {
    const msg = String(e?.message || e);
    const unsupported = /Unsupported URL|not a valid URL/i.test(msg);
    console.error("parse_failed", { message: msg.slice(0, 300) });
    return NextResponse.json(
      { error: unsupported ? "unsupported" : "parse_failed" },
      { status: 422 }
    );
  } finally {
    release();
  }
}
