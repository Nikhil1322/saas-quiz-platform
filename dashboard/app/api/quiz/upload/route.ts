import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

// Public proxy — no auth needed, customers upload photos during quiz
export async function POST(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/quiz/upload`, { 
      method: "POST", 
      body: req.body as any,
      headers: { "Content-Type": req.headers.get("content-type") || "" },
      // @ts-ignore
      duplex: 'half'
    });
    const data = await res.json();
    // Convert  /uploads/filename.jpg  →  /api/img/filename.jpg
    // This makes the URL work through ngrok (same origin as Next.js)
    if (data.url) {
      const filename = data.url.split("/uploads/").pop();
      data.url = `/api/img/${filename}`;
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Upload failed" }, { status: 502 });
  }
}
