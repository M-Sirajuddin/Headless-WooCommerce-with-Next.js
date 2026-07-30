import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { GRAPHQL_URL } from '@/lib/env';

// `@apollo/client` v4 removed the generic type parameter from `ApolloClient`,
// so we no longer annotate it with `ApolloClient<unknown>`.

function makeClient(): ApolloClient {
  return new ApolloClient({
    link: createHttpLink({ uri: GRAPHQL_URL }),
    cache: new InMemoryCache(),
  });
}

// Singleton for client-side usage only.
let clientSideApolloClient: ApolloClient | null = null;

export function getApolloClient(): ApolloClient {
  if (typeof window === 'undefined') {
    // Server: always create a new instance to avoid cross-request state pollution
    return makeClient();
  }
  if (!clientSideApolloClient) {
    clientSideApolloClient = makeClient();
  }
  return clientSideApolloClient;
}
