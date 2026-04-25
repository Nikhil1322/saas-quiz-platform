import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

// Proxy uploaded images through Next.js so they work through ngrok
// /api/img/filename.jpg → localhost:5000/uploads/filename.jpg
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  try {
    const res = await fetch(`${BACKEND}/uploads/${path.join("/")}`, { cache: "force-cache" });
    if (!res.ok) return NextResponse.json({ msg: "Image not found" }, { status: 404 });
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ msg: "Could not fetch image" }, { status: 502 });
  }
}
