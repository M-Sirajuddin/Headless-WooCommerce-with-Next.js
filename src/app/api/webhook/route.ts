import { NextRequest, NextResponse } from 'next/server';
import { updateProductInCache, deleteProductFromCache, writeCache } from '@/lib/api-cache';
import { mapProduct } from '@/lib/graphql/fetcher';

export async function POST(req: NextRequest) {
  try {
    const topic = req.headers.get('x-wc-webhook-topic');
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const productId = Number(body.id);

    if (topic === 'product.deleted') {
      deleteProductFromCache(productId);
      return NextResponse.json({ success: true, action: 'delete', productId });
    }

    if (topic === 'product.updated' || topic === 'product.created') {
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

      return NextResponse.json({ success: true, action: 'update', productId });
    }

    return NextResponse.json({ error: 'Unsupported topic' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
