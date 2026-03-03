import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Client Details", () => {
  it("should retrieve client list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list();
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBeGreaterThan(0);
  });

  it("should add interaction to a client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list();
    expect(clients.length).toBeGreaterThan(0);

    const client = clients[0];

    await caller.interactions.create({
      clientId: client.id,
      type: "call",
      description: "Test call interaction",
      notes: "Test notes",
      outcome: "positive",
    });

    const interactions = await caller.interactions.getByClientId(client.id);
    expect(interactions.length).toBeGreaterThan(0);
    const lastInteraction = interactions[interactions.length - 1];
    expect(lastInteraction.description).toContain("Test call");
    expect(lastInteraction.type).toBe("call");
    expect(lastInteraction.outcome).toBe("positive");
  });

  it("should retrieve interactions for a client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list();
    expect(clients.length).toBeGreaterThan(0);

    const client = clients[0];

    await caller.interactions.create({
      clientId: client.id,
      type: "message",
      description: "Test message",
      outcome: "pending",
    });

    const interactions = await caller.interactions.getByClientId(client.id);
    expect(Array.isArray(interactions)).toBe(true);
    expect(interactions.length).toBeGreaterThan(0);
  });

  it("should handle different interaction types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list();
    expect(clients.length).toBeGreaterThan(0);

    const client = clients[0];
    const types: Array<"call" | "message" | "email" | "meeting" | "note"> = [
      "call",
      "message",
      "email",
      "meeting",
      "note",
    ];

    for (const type of types) {
      await caller.interactions.create({
        clientId: client.id,
        type,
        description: `Test ${type} interaction`,
        outcome: "neutral",
      });
    }

    const interactions = await caller.interactions.getByClientId(client.id);
    expect(interactions.length).toBeGreaterThanOrEqual(types.length);

    for (const type of types) {
      const found = interactions.some((i) => i.type === type);
      expect(found).toBe(true);
    }
  });
});
