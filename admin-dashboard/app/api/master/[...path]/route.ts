import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(req, path.join("/"));
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(req, path.join("/"));
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(req, path.join("/"));
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(req, path.join("/"));
}

async function proxy(req: NextRequest, pathStr: string) {
    const method = req.method;
    const headers = new Headers();
    const auth = req.headers.get("authorization");
    if (auth) headers.set("authorization", auth);
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const isBody = method !== "GET" && method !== "HEAD";
    
    try {
        const res = await fetch(`${BACKEND}/api/master/${pathStr}`, {
            method,
            headers,
            body: isBody ? req.body as any : undefined,
            duplex: isBody ? "half" : undefined,
        } as any);

        const data = await res.text();
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { msg: data }; }
        return NextResponse.json(parsed, { status: res.status });
    } catch {
        return NextResponse.json({ msg: "Proxy error" }, { status: 502 });
    }
}
