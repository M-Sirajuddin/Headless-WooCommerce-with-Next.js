import { REST_URL } from '@/lib/mock';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${REST_URL.replace(/\/$/, '')}`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 503 });
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
