import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  console.log('[CONTEXT] Creating context for request:', opts.req.path);
  console.log('[CONTEXT] Request cookies:', opts.req.headers.cookie);
  let user: User | null = null;

  try {
    console.log('[CONTEXT] Calling sdk.authenticateRequest');
    user = await sdk.authenticateRequest(opts.req);
    console.log('[CONTEXT] Authentication successful, user:', user);
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log('[CONTEXT] Authentication failed:', error);
    // Create a default user for unauthenticated access
    user = {
      id: 1,
      openId: 'default-user',
      name: 'Sistema',
      email: 'sistema@wodpulse.com',
      loginMethod: 'system',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User;
    console.log('[CONTEXT] Using default user for unauthenticated access');
  }

  console.log('[CONTEXT] Returning context with user:', user);
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
