import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.resolve(process.cwd(), "..", "data", "img_cache");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Security check: only proxy HTTPS URLs
  if (!imageUrl.startsWith("https://") && !imageUrl.startsWith("http://")) {
    return new NextResponse("Invalid URL scheme", { status: 400 });
  }

  try {
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const cachedPngPath = path.join(CACHE_DIR, `${hash}.png`);

    // 1. Serve pre-processed transparent PNG from local img_cache if available
    try {
      if (fs.existsSync(cachedPngPath)) {
        const fileBuffer = fs.readFileSync(cachedPngPath);
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch {
      // Ignore filesystem errors on read-only environments
    }

    // 2. Fetch directly with browser headers
    const targetUrl = new URL(imageUrl);
    const referer = targetUrl.hostname.includes("hltv.org")
      ? "https://www.hltv.org/"
      : targetUrl.hostname.includes("liquipedia.net")
      ? "https://liquipedia.net/"
      : `${targetUrl.origin}/`;

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer,
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch image: HTTP ${res.status}`, {
        status: res.status,
      });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    console.error("Image proxy error:", err);
    return new NextResponse(`Failed to proxy image: ${err.message || err}`, { status: 500 });
  }
}
