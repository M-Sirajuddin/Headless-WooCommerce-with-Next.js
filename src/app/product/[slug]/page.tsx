import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Truck, Shield, RefreshCcw } from 'lucide-react';
import { getProduct, getProducts } from '@/lib/graphql/fetcher';
import { formatStorePrice, type StoreApiProduct } from '@/lib/store-api';
import { getStoreProductsCached as getStoreProducts } from '@/lib/store-api-server';
import { STATIC_PRODUCT_LIMIT } from '@/lib/env';
import StarRating from '@/components/ui/StarRating';
import CustomerPriceDisplay from '@/components/ui/CustomerPriceDisplay';
import AddToCartButton from '@/components/ui/AddToCartButton';
import ButtonLink from '@/components/ui/ButtonLink';
import SectionHeader from '@/components/SectionHeader';
import RetailProductCard from '@/components/RetailProductCard';
import ProductStructuredData from '@/components/ProductStructuredData';
import ProductGallery from '@/components/ProductGallery';
import ShareButton from '@/components/ui/ShareButton';
import AddToQuoteButton from '@/components/ui/AddToQuoteButton';

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const connection = await getProducts(STATIC_PRODUCT_LIMIT);
    return connection.edges
      .map((edge) => edge.node)
      .filter((p) => !!p.slug)
      .map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug);
    if (!product) return { title: 'Product not found', robots: { index: false } };
    const description =
      product.shortDescription?.replace(/<[^>]*>/g, '').slice(0, 160) ??
      product.description?.replace(/<[^>]*>/g, '').slice(0, 160) ??
      product.name;
    const canonical = `/product/${product.slug}`;
    const images = product.image?.sourceUrl
      ? [{ url: product.image.sourceUrl, alt: product.name }]
      : undefined;
    return {
      title: product.name,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'website',
        url: canonical,
        title: product.name,
        description,
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description,
        images: images?.map((i) => i.url),
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

function storeProductToProduct(p: StoreApiProduct): import('@/types/woocommerce').Product {
  return {
    id: String(p.id),
    databaseId: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.short_description || null,
    description: p.description || null,
    price: formatStorePrice(p),
    regularPrice: null,
    salePrice: null,
    stockStatus: p.is_in_stock ? 'IN_STOCK' : p.is_on_backorder ? 'ON_BACKORDER' : 'OUT_OF_STOCK',
    averageRating: parseFloat(p.average_rating) || 0,
    reviewCount: p.review_count || 0,
    image: p.images?.[0]
      ? { id: String(p.images[0].id), sourceUrl: p.images[0].src, thumbnailUrl: p.images[0].thumbnail || p.images[0].src, altText: p.images[0].alt || '' }
      : null,
    galleryImages: [],
  };
}

async function getRelatedProducts(excludeId: string, first = 4) {
  const { items } = await getStoreProducts({ perPage: first + 1 });
  return items
    .filter((p) => String(p.id) !== excludeId)
    .slice(0, first)
    .map(storeProductToProduct);
}

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    product = await getProduct(params.slug);
  } catch {
    // backend unreachable — show not-found rather than crashing the pipe
    notFound();
  }
  if (!product) notFound();

  let related: Awaited<ReturnType<typeof getRelatedProducts>> = [];
  try {
    related = await getRelatedProducts(product.id, 4);
  } catch {
    // Related products are non-critical; fall back to an empty list.
  }

  const BRANDS = ["Dazed", "Brixz NYC", "Shrumfuzed", "Hytz", "Myzen Organix", "Rox"];
  const brandName = BRANDS.find(b => {
    const searchTerm = b.toLowerCase() === "brixz nyc" ? "brixz" : b.toLowerCase() === "myzen organix" ? "myzen" : b.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.productCategories?.nodes?.some(cat => cat.name.toLowerCase().includes(searchTerm)) ||
      product.productTags?.nodes?.some(tag => tag.name.toLowerCase().includes(searchTerm))
    );
  });

  const brandSlug = brandName ? brandName.toLowerCase().replace(/\s+/g, '-') : '';

  const stockLabel: Record<typeof product.stockStatus, string> = {
    IN_STOCK: 'In stock — ready to ship',
    OUT_OF_STOCK: 'Out of stock',
    ON_BACKORDER: 'On backorder',
  };
  const stockColor: Record<typeof product.stockStatus, string> = {
    IN_STOCK: 'bg-emerald-500',
    OUT_OF_STOCK: 'bg-red-500',
    ON_BACKORDER: 'bg-amber-500',
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <ProductStructuredData product={product} />
      {/* Breadcrumb */}
      <nav
        className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-black/60"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-black">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-black">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_500px] xl:grid-cols-[1.2fr_480px] items-start">
        {/* Left Column: Gallery (Sticky) */}
        <div className="lg:sticky lg:top-28">
          <ProductGallery
            productName={product.name}
            outOfStock={product.stockStatus === 'OUT_OF_STOCK'}
            images={[
              ...(product.image
                ? [{
                    id: product.image.id,
                    sourceUrl: product.image.sourceUrl,
                    thumbnailUrl: product.image.thumbnailUrl,
                    altText: product.image.altText,
                  }]
                : []),
              ...(product.galleryImages ?? []).map((img) => ({
                id: img.id,
                sourceUrl: img.sourceUrl,
                thumbnailUrl: img.thumbnailUrl,
                altText: img.altText,
              })),
            ]}
          />
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black leading-9">
              {product.name}
            </h1>

            {product.reviewCount > 0 && (
              <div className="mt-3">
                <StarRating
                  rating={product.averageRating}
                  reviewCount={product.reviewCount}
                />
              </div>
            )}
          </div>

          <CustomerPriceDisplay
            productId={product.databaseId}
            price={product.price}
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            size="xl"
          />

          <div className="inline-flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${stockColor[product.stockStatus]} ${
                product.stockStatus === 'IN_STOCK' ? 'animate-pulse' : ''
              }`}
            />
            <span className="text-black/60 font-bold uppercase tracking-[0.14em]">
              {stockLabel[product.stockStatus]}
            </span>
          </div>

          {product.shortDescription && (
            <div
              className="prose prose-sm max-w-none text-black/65 leading-6 border-t border-black/10 pt-4"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row border-t border-black/10 pt-6">
            <AddToCartButton product={product} className="flex-1 rounded-none bg-black text-white hover:bg-[#d93b2e] h-12 uppercase font-black text-xs tracking-[0.18em] transition-colors" />
            <ButtonLink
              href="/cart"
              variant="outline"
              size="lg"
              className="flex-1 rounded-none border-black hover:bg-black hover:text-white h-12 uppercase font-black text-xs tracking-[0.18em]"
            >
              View cart
            </ButtonLink>
            <ShareButton title={product.name} />
          </div>

          {/* Request a Quote — available on every product, supports multi-item quotes */}
          <AddToQuoteButton
            product={{
              id: String(product.databaseId),
              name: product.name,
              slug: product.slug,
              price: product.price,
              imageUrl: product.image?.thumbnailUrl ?? product.image?.sourceUrl ?? "",
            }}
          />

          {/* Collapsible Details Accordion */}
          <div className="border-t border-black/10 pt-4 space-y-2">
            {product.description && (
              <details className="group border-b border-black/10 pb-4">
                <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-black uppercase tracking-[0.16em] text-black list-none [&::-webkit-details-marker]:hidden">
                  <span>Product Description</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-black/45" />
                </summary>
                <div
                  className="prose prose-sm pb-2 pt-1 text-black/65 leading-6"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </details>
            )}

            <details className="group border-b border-black/10 pb-4">
              <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-black uppercase tracking-[0.16em] text-black list-none [&::-webkit-details-marker]:hidden">
                <span>Shipping & Returns</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-black/45" />
              </summary>
              <div className="pb-2 pt-1 text-sm text-black/65 leading-6 space-y-2">
                <p>
                  <strong>Fast Wholesale Shipping:</strong> Standard orders are processed within 1-2 business days. Shipping is flat-rate ($20) for quantities of 30 and below, and free for wholesale orders above $75+.
                </p>
                <p>
                  <strong>Hassle-Free Returns:</strong> We offer a 30-day return policy on all unopened bulk items. Please reach out to your sales representative to initiate a return or exchange.
                </p>
              </div>
            </details>

            <details className="group border-b border-black/10 pb-4">
              <summary className="flex cursor-pointer items-center justify-between py-3 text-sm font-black uppercase tracking-[0.16em] text-black list-none [&::-webkit-details-marker]:hidden">
                <span>Wholesale Ordering Info</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-black/45" />
              </summary>
              <div className="pb-2 pt-1 text-sm text-black/65 leading-6 space-y-2">
                <p>
                  We supply premium products direct to retailers, dispensaries, and smoke shops. By placing an order, you confirm that you possess a valid state retail license.
                </p>
              </div>
            </details>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-1 gap-4 rounded-none border border-black/10 bg-white p-4 sm:grid-cols-3 text-xs font-bold uppercase tracking-[0.12em] text-black/60">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#d93b2e] shrink-0" />
              <span>Free shipping $75+</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-[#d93b2e] shrink-0" />
              <span>30-day returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#d93b2e] shrink-0" />
              <span>Secure checkout</span>
            </div>
          </div>

          {/* Product Meta (Brand, Categories, Tags) */}
          <div className="border-t border-black/10 pt-6 space-y-3">
            {brandName && (
              <div className="text-xs font-bold uppercase tracking-[0.14em]">
                <span className="text-black/45">Brand: </span>
                <Link href={`/brand/${brandSlug}`} className="text-black hover:text-[#d93b2e] underline underline-offset-4">
                  {brandName}
                </Link>
              </div>
            )}

            {product.productCategories?.nodes && product.productCategories.nodes.length > 0 && (
              <div className="text-xs font-bold uppercase tracking-[0.14em]">
                <span className="text-black/45">Categories: </span>
                <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                  {product.productCategories.nodes.map((cat, i) => (
                    <span key={cat.id}>
                      <Link href={`/category/${cat.slug}`} className="text-black hover:text-[#d93b2e] underline underline-offset-4">
                        {cat.name}
                      </Link>
                      {i < product.productCategories!.nodes.length - 1 && <span className="text-black/35">,</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {product.productTags?.nodes && product.productTags.nodes.length > 0 && (
              <div className="text-xs font-bold uppercase tracking-[0.14em]">
                <span className="text-black/45">Tags: </span>
                <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                  {product.productTags.nodes.map((tag, i) => (
                    <span key={tag.id}>
                      <Link href={`/tag/${tag.slug}`} className="text-black hover:text-[#d93b2e] underline underline-offset-4">
                        {tag.name}
                      </Link>
                      {i < product.productTags!.nodes.length - 1 && <span className="text-black/35">,</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Section */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-black/10 pt-12">
          <SectionHeader
            eyebrow="More to love"
            title="You may also like"
            action={{ label: 'View all', href: '/products' }}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4">
            {related.map((prod) => (
              <RetailProductCard key={prod.id} product={prod as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
