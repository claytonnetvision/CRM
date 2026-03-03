import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createTestContext(): TrpcContext {
  const user: User = {
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
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("clients router", () => {
  it("should validate required fields on client creation", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.clients.create({
        name: "",
        phone: "123",
        boxName: "",
        address: undefined,
        city: "Belo Horizonte",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should create a client with valid data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clients.create({
      name: "João Silva",
      phone: "(31) 99999-9999",
      boxName: "CrossFit BH",
      address: "Rua das Flores, 123",
      city: "Belo Horizonte",
      totalClients: 50,
      contractedClients: 10,
      contractStatus: "pending",
    });

    expect(result.success).toBe(true);
  });

  it("should list clients for authenticated user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a client
    await caller.clients.create({
      name: "Test Client",
      phone: "(31) 99999-9999",
      boxName: "Test Box",
      contractStatus: "pending",
    });

    // Then list clients
    const clients = await caller.clients.list({});
    expect(Array.isArray(clients)).toBe(true);
  });

  it("should filter clients by status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list({
      status: "pending",
    });

    expect(Array.isArray(clients)).toBe(true);
    clients.forEach((client) => {
      expect(client.contractStatus).toBe("pending");
    });
  });

  it("should search clients by name", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list({
      searchTerm: "Test",
    });

    expect(Array.isArray(clients)).toBe(true);
  });
});

describe("interactions router", () => {
  it("should create an interaction for a client", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a client first
    await caller.clients.create({
      name: "Test Client",
      phone: "(31) 99999-9999",
      boxName: "Test Box",
    });

    // Get the client
    const clients = await caller.clients.list({});
    const clientId = clients[0]?.id;

    if (!clientId) {
      expect.fail("Client not created");
    }

    // Create an interaction
    const result = await caller.interactions.create({
      clientId,
      type: "call",
      description: "Test call",
      outcome: "positive",
    });

    expect(result.success).toBe(true);
  });
});

describe("leads router", () => {
  it("should list leads for user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const leads = await caller.leads.list({});
    expect(Array.isArray(leads)).toBe(true);
  });

  it("should create a lead", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.create({
      name: "CrossFit Test",
      type: "crossfit_box",
      address: "Rua Test, 123",
      phone: "(31) 99999-9999",
      rating: 4.5,
      reviewCount: 100,
    });

    expect(result.success).toBe(true);
  });
});
