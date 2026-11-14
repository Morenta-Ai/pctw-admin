import "server-only";

import { ApiError } from "@/core/api/api-error";
import { paginate } from "@/core/paged";
import type {
  Redemption,
  RedemptionQuery,
} from "@/features/redemptions/data/models";
import type { RedemptionsSource } from "@/features/redemptions/data/redemptions-source";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockRedemption } from "@/mock/types";

export class RedemptionsMockSource implements RedemptionsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly getAccessToken: () => Promise<string | undefined>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: RedemptionQuery) {
    await mockLatency();
    const q = query.q?.toLowerCase();
    const rows = this.world.redemptions
      .filter((r) => !query.type || r.type === query.type)
      .filter((r) => !query.status || r.status === query.status)
      .filter((r) => {
        if (!q) return true;
        const c = this.world.customer(r.customerId);
        return `${r.id} ${c?.firstName} ${c?.lastName} ${c?.mobile} ${r.reference ?? ""}`
          .toLowerCase()
          .includes(q);
      })
      // The pending queue is worked oldest first; history reads newest first.
      .sort((a, b) =>
        query.status === "pending"
          ? a.requestedAt.localeCompare(b.requestedAt)
          : b.requestedAt.localeCompare(a.requestedAt),
      );
    const page = paginate(rows, query.page);
    return { ...page, items: page.items.map((r) => this.toRedemption(r)) };
  }

  async pay(id: string, reference: string) {
    await mockLatency(300);
    const redemption = await this.close(id);
    redemption.status = "paid";
    redemption.reference = reference;
    return this.toRedemption(redemption);
  }

  async reject(id: string, reason: string) {
    await mockLatency(300);
    const redemption = await this.close(id);
    redemption.status = "rejected";
    redemption.rejectReason = reason;
    return this.toRedemption(redemption);
  }

  /** The pending cash redemption, stamped with who closed it and when. */
  private async close(id: string): Promise<MockRedemption> {
    const redemption = this.world.redemptions.find((r) => r.id === id);
    if (!redemption) {
      throw new ApiError({
        code: "REDEMPTION_NOT_FOUND",
        message: `No redemption ${id}.`,
        status: 404,
      });
    }
    if (redemption.status !== "pending") {
      throw new ApiError({
        code: "REDEMPTION_CLOSED",
        message: "This redemption has already been handled.",
        status: 409,
      });
    }
    const staff = this.world.staffForToken(await this.getAccessToken());
    redemption.processedAt = this.now().toISOString();
    redemption.processedBy = staff?.name ?? "Staff";
    return redemption;
  }

  private toRedemption(r: MockRedemption): Redemption {
    const customer = this.world.customer(r.customerId);
    const project = this.world.donationProjects.find(
      (p) => p.id === r.projectId,
    );
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      amountCents: r.amountCents,
      customer: {
        id: r.customerId,
        name: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Unknown customer",
        mobile: customer?.mobile ?? "",
      },
      bank: r.bank,
      voucher: r.voucher,
      donation: project
        ? { projectId: project.id, projectName: project.name }
        : null,
      requestedAt: r.requestedAt,
      processedAt: r.processedAt,
      processedBy: r.processedBy,
      reference: r.reference,
      rejectReason: r.rejectReason,
    };
  }
}
