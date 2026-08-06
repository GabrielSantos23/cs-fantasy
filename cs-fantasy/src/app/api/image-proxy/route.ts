import { NextRequest, NextResponse } from "next/server";
import { gotScraping } from "got-scraping";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  if (!imageUrl || imageUrl === "undefined" || imageUrl === "null") {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!imageUrl.startsWith("https://") && !imageUrl.startsWith("http://")) {
    return new NextResponse("Invalid URL scheme", { status: 400 });
  }

  try {
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const localPaths = [
      path.join(process.cwd(), "public", "data", "img_cache", `${hash}.png`),
      path.join(process.cwd(), "data", "img_cache", `${hash}.png`),
      path.join(process.cwd(), "..", "data", "img_cache", `${hash}.png`),
    ];

    for (const cachedPngPath of localPaths) {
      try {
        if (fs.existsSync(cachedPngPath)) {
          const fileBuffer = fs.readFileSync(cachedPngPath);
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch {
        // ignore
      }
    }

    const targetUrl = new URL(imageUrl);
    const referer = targetUrl.hostname.includes("hltv.org")
      ? "https://www.hltv.org/"
      : targetUrl.hostname.includes("liquipedia.net")
      ? "https://liquipedia.net/"
      : `${targetUrl.origin}/`;

    // Attempt 1: gotScraping (TLS fingerprint bypass for Cloudflare)
    try {
      const res = await gotScraping({
        url: imageUrl,
        headers: {
          Referer: referer,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        timeout: { request: 10000 },
      });

      if (res.statusCode === 200 && res.rawBody && res.rawBody.length > 0) {
        const contentType = (res.headers["content-type"] as string) || "image/png";
        return new NextResponse(new Uint8Array(res.rawBody), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch (gotErr) {
      console.warn("gotScraping attempt failed, trying fetch fallback...", gotErr);
    }

    // Attempt 2: Native fetch fallback
    try {
      const fetchRes = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: referer,
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        next: { revalidate: 86400 },
      });

      if (fetchRes.ok) {
        const arrayBuf = await fetchRes.arrayBuffer();
        const contentType = fetchRes.headers.get("content-type") || "image/png";
        return new NextResponse(new Uint8Array(arrayBuf), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch (fetchErr) {
      console.error("Fetch fallback failed:", fetchErr);
    }

    return new NextResponse("Failed to fetch image from remote source", { status: 502 });
  } catch (err: any) {
    console.error("Image proxy error:", err);
    return new NextResponse(`Failed to proxy image: ${err.message || err}`, { status: 500 });
  }
}
