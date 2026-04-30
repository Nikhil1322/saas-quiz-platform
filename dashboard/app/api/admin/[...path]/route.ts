import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

// Proxy all admin API requests to the backend
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/api/admin/${path.join("/")}`;
  const auth = req.headers.get("authorization") || "";
  try {
    const res = await fetch(url, { headers: { authorization: auth }, cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/api/admin/${path.join("/")}`;
  const auth = req.headers.get("authorization") || "";
  const body = await req.text();
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", authorization: auth }, body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Backend unreachable" }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/api/admin/${path.join("/")}`;
  const auth = req.headers.get("authorization") || "";
  const body = await req.text();
  try {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json", authorization: auth }, body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Backend unreachable" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/api/admin/${path.join("/")}`;
  const auth = req.headers.get("authorization") || "";
  try {
    const res = await fetch(url, { method: "DELETE", headers: { authorization: auth } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ msg: "Backend unreachable" }, { status: 502 });
  }
}
