/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders an accessible loading status", () => {
    render(<LoadingSpinner label="Saving profile" />);

    expect(screen.getByRole("status", { name: "Saving profile" })).toBeInTheDocument();
  });
});
