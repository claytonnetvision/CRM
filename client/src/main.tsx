console.log('[INIT] Starting application initialization');

import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

console.log('[INIT] Imports completed');

console.log('[INIT] Creating QueryClient');
const queryClient = new QueryClient();
console.log('[INIT] QueryClient created');

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

console.log('[INIT] Setting up QueryCache subscriber');
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
    redirectToLoginIfUnauthorized(error);
  }
});
console.log('[INIT] QueryCache subscriber configured');

console.log('[INIT] Setting up MutationCache subscriber');
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
    redirectToLoginIfUnauthorized(error);
  }
});
console.log('[INIT] MutationCache subscriber configured');

console.log('[INIT] Creating tRPC client');
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        console.log('[TRPC] Fetch request:', input);
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        }).then(res => {
          console.log('[TRPC] Fetch response status:', res.status);
          return res;
        }).catch(err => {
          console.error('[TRPC] Fetch error:', err);
          throw err;
        });
      },
    }),
  ],
});
console.log('[INIT] tRPC client created');

console.log('[INIT] Getting root element');
const rootElement = document.getElementById("root");
console.log('[INIT] Root element:', rootElement);

if (!rootElement) {
  console.error('[INIT] Root element not found!');
  throw new Error('Root element not found');
}

console.log('[INIT] Rendering React app');
createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
console.log('[INIT] React app rendered successfully');
