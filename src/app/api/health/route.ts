import { REST_URL } from '@/lib/env';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${REST_URL.replace(/\/$/, '')}/wc/store/v1/products?per_page=1`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(timer);
    // Echo the real upstream state in BOTH the body and the status code so
    // it's unambiguous in devtools (green = up, red 503 = down).
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 503 });
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
