/** @vitest-environment jsdom */

import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/lib/i18n/test-utils";

import { WorkPublishFormFooter } from "./WorkPublishFormFooter";
import { createEmptyWorkPublishForm } from "@/lib/works/work-publish-form-state";

describe("WorkPublishFormFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps upload disabled until the immutability acknowledgment is checked", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const onAcknowledgedChange = vi.fn();

    renderWithI18n(
      <WorkPublishFormFooter
        values={createEmptyWorkPublishForm()}
        errors={{}}
        step="idle"
        editionPreviewReady
        editionPreviewAcknowledged={false}
        metadataPreview={null}
        txHash={null}
        errorMessage={null}
        isBusy={false}
        isComplete={false}
        onFieldChange={() => undefined}
        onPreviewEdition={() => undefined}
        onEditionPreviewAcknowledgedChange={onAcknowledgedChange}
        onUpload={onUpload}
        onRegister={() => undefined}
      />,
    );

    const uploadButton = screen.getByRole("button", { name: /Upload to IPFS/i });
    expect(uploadButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(onAcknowledgedChange).toHaveBeenCalledWith(true);
  });

  it("enables upload when preview and acknowledgment are both ready", () => {
    renderWithI18n(
      <WorkPublishFormFooter
        values={createEmptyWorkPublishForm()}
        errors={{}}
        step="idle"
        editionPreviewReady
        editionPreviewAcknowledged
        metadataPreview={null}
        txHash={null}
        errorMessage={null}
        isBusy={false}
        isComplete={false}
        onFieldChange={() => undefined}
        onPreviewEdition={() => undefined}
        onEditionPreviewAcknowledgedChange={() => undefined}
        onUpload={() => undefined}
        onRegister={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /Upload to IPFS/i })).toBeEnabled();
  });
});
