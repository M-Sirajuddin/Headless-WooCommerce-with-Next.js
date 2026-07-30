export interface RatingMetadata {
  rating: number;
  count: number;
}

export interface ProductImage {
  id: string;
  sourceUrl: string;
  /** Small (~300px) image for cards/cart. Falls back to sourceUrl. */
  thumbnailUrl?: string;
  altText: string;
}

export interface Product {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  price: string; // Formatted price string e.g. "$29.99"
  regularPrice: string | null;
  salePrice: string | null;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER';
  averageRating: number; // 0.0 – 5.0
  reviewCount: number;
  image: ProductImage | null;
  galleryImages: ProductImage[];
  productCategories?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  productTags?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export interface ProductEdge {
  cursor: string;
  node: Product;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ProductConnection {
  edges: ProductEdge[];
  pageInfo: PageInfo;
}
