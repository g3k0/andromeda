/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { translate } from "@/lib/i18n/translate";
import { LoadingProvider, useLoading } from "./LoadingProvider";

let resolveTask: (() => void) | undefined;

function LoadingConsumer() {
  const { runWithLoading } = useLoading();

  return (
    <button
      type="button"
      onClick={() => {
        void runWithLoading(
          () =>
            new Promise<void>((resolve) => {
              resolveTask = resolve;
            }),
        );
      }}
    >
      Run task
    </button>
  );
}

describe("LoadingProvider", () => {
  afterEach(() => {
    cleanup();
    resolveTask = undefined;
  });

  it("shows the localized default processing label", async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider locale="it">
        <LoadingProvider>
          <LoadingConsumer />
        </LoadingProvider>
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Run task" }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(translate("it", "common.processing")),
      ).toBeInTheDocument();
    });

    resolveTask?.();
  });
});
