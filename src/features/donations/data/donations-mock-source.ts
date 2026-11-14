import "server-only";

import { ApiError } from "@/core/api/api-error";
import { colomboDateKey } from "@/core/time";
import type { DonationsSource } from "@/features/donations/data/donations-source";
import type {
  DonationProject,
  DonationProjectInput,
} from "@/features/donations/data/models";
import { mockLatency, type MockWorld } from "@/mock/mock-world";
import type { MockDonationProject } from "@/mock/types";

export class DonationsMockSource implements DonationsSource {
  constructor(
    private readonly world: MockWorld,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list() {
    await mockLatency();
    return this.world.donationProjects
      .map((p) => this.toProject(p))
      .sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }

  async create(input: DonationProjectInput) {
    await mockLatency(300);
    this.checkEndsOn(input.endsOn);
    const project: MockDonationProject = {
      id: this.world.nextId("dp"),
      name: input.name,
      summary: input.summary,
      goalCents: input.goalCents,
      baseRaisedCents: 0,
      baseDonorCount: 0,
      active: input.active,
      endsOn: input.endsOn,
      createdAt: this.now().toISOString(),
    };
    this.world.donationProjects.push(project);
    return this.toProject(project);
  }

  async update(id: string, input: Partial<DonationProjectInput>) {
    await mockLatency(300);
    const project = this.world.donationProjects.find((p) => p.id === id);
    if (!project) {
      throw new ApiError({
        code: "PROJECT_NOT_FOUND",
        message: `No project ${id}.`,
        status: 404,
      });
    }
    if (input.endsOn !== undefined) this.checkEndsOn(input.endsOn);
    Object.assign(project, input);
    return this.toProject(project);
  }

  private checkEndsOn(endsOn: string | null) {
    if (endsOn && endsOn < colomboDateKey(this.now())) {
      throw new ApiError({
        code: "VALIDATION_FAILED",
        message: "The end date has passed.",
        status: 422,
        details: { endsOn: "Choose today or a later date." },
      });
    }
  }

  private toProject(project: MockDonationProject): DonationProject {
    const donations = this.world.redemptions.filter(
      (r) => r.type === "donation" && r.projectId === project.id,
    );
    return {
      id: project.id,
      name: project.name,
      summary: project.summary,
      goalCents: project.goalCents,
      raisedCents:
        project.baseRaisedCents +
        donations.reduce((sum, r) => sum + r.amountCents, 0),
      donorCount:
        project.baseDonorCount +
        new Set(donations.map((r) => r.customerId)).size,
      active: project.active,
      endsOn: project.endsOn,
      createdAt: project.createdAt,
    };
  }
}
