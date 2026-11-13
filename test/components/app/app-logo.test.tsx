import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppLogo } from "@/components/app/app-logo";

describe("AppLogo", () => {
  it("shows the wordmark and the product label", () => {
    render(<AppLogo label="Admin" />);

    expect(screen.getByText("ReThread")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
