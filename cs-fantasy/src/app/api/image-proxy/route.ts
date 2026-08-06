import { NextRequest, NextResponse } from "next/server";
import { gotScraping } from "got-scraping";
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

    // Serve pre-processed transparent PNG from local img_cache if available
    if (fs.existsSync(cachedPngPath)) {
      const fileBuffer = fs.readFileSync(cachedPngPath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const targetUrl = new URL(imageUrl);
    const referer = targetUrl.hostname.includes("hltv.org")
      ? "https://www.hltv.org/"
      : targetUrl.hostname.includes("liquipedia.net")
      ? "https://liquipedia.net/"
      : `${targetUrl.origin}/`;

    const res = await gotScraping({
      url: imageUrl,
      headers: {
        Referer: referer,
      },
      timeout: { request: 15000 },
    });

    if (res.statusCode !== 200) {
      return new NextResponse(`Failed to fetch image: HTTP ${res.statusCode}`, {
        status: res.statusCode,
      });
    }

    const contentType = (res.headers["content-type"] as string) || "image/jpeg";
    const imageBuffer = res.rawBody;

    return new NextResponse(new Uint8Array(imageBuffer), {
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
