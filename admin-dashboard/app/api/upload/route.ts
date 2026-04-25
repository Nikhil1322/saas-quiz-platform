import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  try {
    const res = await fetch(`${BACKEND}/api/upload`, {
      method: "POST",
      headers: { 
        authorization: auth,
        "Content-Type": req.headers.get("content-type") || ""
      },
      body: req.body as any,
      // @ts-ignore
      duplex: 'half'
    });
    const data = await res.json();
    // Return /api/img/filename so it works through ngrok
    if (data.url) {
      const filename = data.url.split("/uploads/").pop();
      data.url = `/api/img/${filename}`;
      data.fullUrl = data.url; // same, relative = works anywhere
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Upload failed" }, { status: 502 });
  }
}
