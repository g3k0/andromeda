/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormFieldLabel } from "./FormFieldLabel";

describe("FormFieldLabel", () => {
  it("marks required fields with an asterisk and screen reader hint", () => {
    render(
      <FormFieldLabel
        htmlFor="field-id"
        label="Title"
        required
        tooltipId="field-tooltip"
        tooltip="Help text"
      />,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("(required)", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("Help text")).toBeInTheDocument();
  });
});
