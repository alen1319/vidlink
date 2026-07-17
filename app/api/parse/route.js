import { NextResponse } from "next/server";
import { fetchInfo, buildResult, isValidUrl } from "@/app/lib/ytdlp";
import { rateLimit } from "@/app/lib/ratelimit";
import { LIMITS, clientIp } from "@/app/lib/limits";

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
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const url = (body?.url || "").trim();
  const lang = body?.lang === "zh" ? "zh" : "en";

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const info = await fetchInfo(url);

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
    return NextResponse.json(
      { error: unsupported ? "unsupported" : "parse_failed", detail: msg.slice(0, 300) },
      { status: 422 }
    );
  }
}
