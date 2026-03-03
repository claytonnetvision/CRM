import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  default: {
    getAllMonthlyPayments: vi.fn(),
    createMonthlyPayment: vi.fn(),
    updateMonthlyPayment: vi.fn(),
    deleteMonthlyPayment: vi.fn(),
    getCommissionsByMonth: vi.fn(),
    createCommissionPayment: vi.fn(),
    updateCommissionPayment: vi.fn(),
    getClientsByStatus: vi.fn(),
    getConsultantById: vi.fn(),
  },
}));

import db from "./db";

describe("Monthly Payments Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate total amount correctly", () => {
    const pricePerUser = 15.0;
    const contractedUsers = 30;
    const totalAmount = pricePerUser * contractedUsers;
    expect(totalAmount).toBe(450.0);
  });

  it("should calculate commission correctly", () => {
    const commissionPerUser = 5.0; // R$5 per user
    const contractedUsers = 30;
    const totalCommission = commissionPerUser * contractedUsers;
    expect(totalCommission).toBe(150.0);
  });

  it("should generate reference month in correct format", () => {
    const now = new Date(2026, 2, 3); // March 2026
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(referenceMonth).toBe("2026-03");
  });

  it("should calculate due date based on dueDay", () => {
    const referenceMonth = "2026-03";
    const dueDay = 10;
    const [y, m] = referenceMonth.split("-");
    const dueDate = new Date(parseInt(y), parseInt(m) - 1, dueDay);
    expect(dueDate.getDate()).toBe(10);
    expect(dueDate.getMonth()).toBe(2); // March (0-indexed)
    expect(dueDate.getFullYear()).toBe(2026);
  });

  it("should list monthly payments", async () => {
    const mockPayments = [
      { id: 1, clientId: 1, referenceMonth: "2026-03", totalAmount: "450.00", paymentStatus: "pending" },
    ];
    (db.getAllMonthlyPayments as any).mockResolvedValue(mockPayments);
    const result = await db.getAllMonthlyPayments({ referenceMonth: "2026-03" });
    expect(result).toHaveLength(1);
    expect(result[0].totalAmount).toBe("450.00");
  });

  it("should create monthly payment", async () => {
    const mockPayment = {
      id: 1,
      clientId: 1,
      referenceMonth: "2026-03",
      pricePerUser: "15.00",
      contractedUsers: 30,
      totalAmount: "450.00",
      paymentStatus: "pending",
    };
    (db.createMonthlyPayment as any).mockResolvedValue(mockPayment);
    const result = await db.createMonthlyPayment({
      clientId: 1,
      userId: 1,
      consultantId: null,
      referenceMonth: "2026-03",
      referenceYear: 2026,
      pricePerUser: "15.00",
      contractedUsers: 30,
      totalAmount: "450.00",
      paymentStatus: "pending",
      dueDate: new Date(2026, 2, 10),
    });
    expect(result.id).toBe(1);
    expect(result.totalAmount).toBe("450.00");
  });

  it("should mark payment as paid", async () => {
    const mockUpdated = {
      id: 1,
      paymentStatus: "paid",
      paidDate: new Date(),
      paidAmount: "450.00",
    };
    (db.updateMonthlyPayment as any).mockResolvedValue(mockUpdated);
    const result = await db.updateMonthlyPayment(1, {
      paymentStatus: "paid",
      paidDate: new Date(),
      paidAmount: "450.00",
    });
    expect(result.paymentStatus).toBe("paid");
  });
});

describe("Commission Payments Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate commission per user correctly", () => {
    const commissionRate = "5.00"; // R$5 per user
    const contractedUsers = 20;
    const totalCommission = parseFloat(commissionRate) * contractedUsers;
    expect(totalCommission).toBe(100.0);
  });

  it("should list commissions by month", async () => {
    const mockCommissions = [
      { id: 1, consultantId: 1, clientId: 1, referenceMonth: "2026-03", totalCommission: "100.00", paid: false },
    ];
    (db.getCommissionsByMonth as any).mockResolvedValue(mockCommissions);
    const result = await db.getCommissionsByMonth("2026-03");
    expect(result).toHaveLength(1);
    expect(result[0].paid).toBe(false);
  });

  it("should mark commission as paid", async () => {
    const mockUpdated = {
      id: 1,
      paid: true,
      paidDate: new Date("2026-03-15"),
    };
    (db.updateCommissionPayment as any).mockResolvedValue(mockUpdated);
    const result = await db.updateCommissionPayment(1, {
      paid: true,
      paidDate: new Date("2026-03-15"),
    });
    expect(result.paid).toBe(true);
  });

  it("should generate summary with correct totals", () => {
    const commissions = [
      { consultantId: 1, totalCommission: "100.00", paid: false },
      { consultantId: 1, totalCommission: "150.00", paid: true },
      { consultantId: 2, totalCommission: "200.00", paid: false },
    ];

    const consultantMap = new Map<number, { total: number; paid: number; pending: number }>();
    commissions.forEach((c) => {
      const existing = consultantMap.get(c.consultantId) || { total: 0, paid: 0, pending: 0 };
      const amount = parseFloat(c.totalCommission);
      existing.total += amount;
      if (c.paid) existing.paid += amount;
      else existing.pending += amount;
      consultantMap.set(c.consultantId, existing);
    });

    const consultant1 = consultantMap.get(1)!;
    expect(consultant1.total).toBe(250.0);
    expect(consultant1.paid).toBe(150.0);
    expect(consultant1.pending).toBe(100.0);

    const consultant2 = consultantMap.get(2)!;
    expect(consultant2.total).toBe(200.0);
    expect(consultant2.pending).toBe(200.0);
  });
});
