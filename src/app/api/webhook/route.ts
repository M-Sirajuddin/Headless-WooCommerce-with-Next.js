import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { updateProductInCache, deleteProductFromCache, writeCache } from '@/lib/api-cache';
import { mapProduct } from '@/lib/graphql/fetcher';

export async function POST(req: NextRequest) {
  try {
    const topic = req.headers.get('x-wc-webhook-topic');
    const arrayBuffer = await req.arrayBuffer();
    const rawBodyBuffer = Buffer.from(arrayBuffer);

    // Verify WooCommerce webhook signature if a secret is configured
    let secret = process.env.WC_WEBHOOK_SECRET;
    if (secret) {
      secret = secret.replace(/^["']|["']$/g, '').trim();
      const signature = req.headers.get('x-wc-webhook-signature');
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBodyBuffer)
        .digest('base64');

      if (signature !== computedSignature) {
        return NextResponse.json({ 
          error: 'Unauthorized signature',
          received: signature,
          computed: computedSignature,
          secretLength: secret.length
        }, { status: 401 });
      }
    }

    if (topic === 'webhook.test') {
      return NextResponse.json({ success: true, action: 'test' });
    }

    const body = JSON.parse(rawBodyBuffer.toString('utf-8'));

    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const productId = Number(body.id);

    if (topic === 'product.deleted') {
      deleteProductFromCache(productId);
      
      // Purge CDN caches on-demand
      try {
        revalidatePath('/products');
        revalidatePath('/');
        if (body.slug) {
          revalidatePath(`/product/${body.slug}`);
        }
        if (body.categories && Array.isArray(body.categories)) {
          body.categories.forEach((cat: any) => {
            if (cat.slug) revalidatePath(`/category/${cat.slug}`);
          });
        }
      } catch {}

      return NextResponse.json({ success: true, action: 'delete', productId });
    }

    if (topic === 'product.updated' || topic === 'product.created' || topic === 'product.restored') {
      const price = body.price || '0';
      const regularPrice = body.regular_price || price;
      const salePrice = body.sale_price || '';

      const factor = 100;
      const toMinor = (val: string) => {
        if (!val) return '0';
        return String(Math.round(parseFloat(val) * factor));
      };

      const images = (body.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        thumbnail: img.src,
        alt: img.alt || '',
      }));

      const categories = (body.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      }));

      const storeProduct = {
        id: body.id,
        name: body.name,
        slug: body.slug,
        permalink: body.permalink || '',
        sku: body.sku || '',
        short_description: body.short_description || '',
        description: body.description || '',
        on_sale: body.on_sale || false,
        images,
        categories,
        average_rating: body.average_rating || '0',
        review_count: body.review_count || 0,
        is_in_stock: body.stock_status === 'instock',
        is_on_backorder: body.stock_status === 'onbackorder',
        prices: {
          price: toMinor(price),
          regular_price: toMinor(regularPrice),
          sale_price: toMinor(salePrice),
          currency_code: 'USD',
          currency_symbol: '$',
          currency_minor_unit: 2,
          currency_decimal_separator: '.',
          currency_thousand_separator: ',',
          currency_prefix: '$',
          currency_suffix: '',
        }
      };

      const mappedProduct = mapProduct(storeProduct);

      // 1. Update the individual product cache file
      writeCache(`gql_product_${body.slug}`, mappedProduct);

      // 2. Update the product inside lists / search results caches (StoreApiProduct format)
      updateProductInCache(productId, storeProduct);

      // 3. Update the product inside graphql lists / search results caches (Product format)
      updateProductInCache(productId, mappedProduct);

      // 4. Purge Vercel/Next.js CDN caches on-demand
      try {
        revalidatePath(`/product/${body.slug}`);
        revalidatePath('/products');
        revalidatePath('/');
        if (body.categories && Array.isArray(body.categories)) {
          body.categories.forEach((cat: any) => {
            if (cat.slug) revalidatePath(`/category/${cat.slug}`);
          });
        }
      } catch {}

      return NextResponse.json({ success: true, action: 'update', productId });
    }

    return NextResponse.json({ error: 'Unsupported topic' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
