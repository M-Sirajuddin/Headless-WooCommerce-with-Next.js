import { gql } from '@apollo/client';

export const GET_PRODUCTS_QUERY = gql`
  query GetProducts($first: Int, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          databaseId
          slug
          name
          shortDescription
          description
          ... on SimpleProduct {
            price
            regularPrice
            salePrice
            stockStatus
            averageRating
            reviewCount
          }
          image {
            id
            sourceUrl
            altText
          }
          galleryImages {
            nodes {
              id
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG_QUERY = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      name
      shortDescription
      description
      ... on SimpleProduct {
        price
        regularPrice
        salePrice
        stockStatus
        averageRating
        reviewCount
      }
      image {
        id
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          id
          sourceUrl
          altText
        }
      }
    }
  }
`;
