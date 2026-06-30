/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkPublishView } from "./WorkPublishView";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { createEmptyWorkPublishForm } from "@/lib/works/work-publish-form-state";

const metadata: AcePublicMetadata = {
  name: "Novella",
  description: "Encrypted story.",
  image: "ipfs://cover",
  ace: {
    version: "1",
    encrypted_content: "ipfs://content",
    cipher: "aes-256-gcm",
    envelope_scheme: "ecies-secp256k1",
    tba_standard: "erc-6551",
    chain_id: 80002,
    contract: "0x1111111111111111111111111111111111111111",
    registry: "0x2222222222222222222222222222222222222222",
  },
};

describe("WorkPublishView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders metadata preview when upload is ready", () => {
    render(
      <WorkPublishView
        values={createEmptyWorkPublishForm()}
        errors={{}}
        step="ready"
        coverImageName="cover.png"
        manuscriptFileName="novel.txt"
        metadataPreview={metadata}
        txHash={null}
        errorMessage={null}
        onFieldChange={() => undefined}
        onCoverImageChange={() => undefined}
        onManuscriptFileChange={() => undefined}
        onUpload={() => undefined}
        onRegister={() => undefined}
      />,
    );

    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(screen.getByText(/Fields marked with/i)).toBeInTheDocument();
    expect(screen.getByText(/ACE metadata preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & editions/i)).toBeInTheDocument();
    expect(screen.getByText(/Leave blank to register/i)).toBeInTheDocument();
    expect(screen.getByText(/copy #1 versus copy #145/i)).toBeInTheDocument();
    expect(screen.getByText(/Register on-chain/i)).toBeInTheDocument();
  });

  it("marks invalid fields with aria-invalid and shows field errors", () => {
    render(
      <WorkPublishView
        values={createEmptyWorkPublishForm()}
        errors={{
          name: "Title is required.",
          manuscriptFile: "Manuscript file is required.",
        }}
        step="idle"
        coverImageName={null}
        manuscriptFileName={null}
        metadataPreview={null}
        txHash={null}
        errorMessage={null}
        onFieldChange={() => undefined}
        onCoverImageChange={() => undefined}
        onManuscriptFileChange={() => undefined}
        onUpload={() => undefined}
        onRegister={() => undefined}
      />,
    );

    expect(screen.getByRole("textbox", { name: /^Title/i })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(/Manuscript file/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Title is required.")).toHaveAttribute("role", "alert");
  });
});
