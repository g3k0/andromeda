/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { createEmptyWorkPublishForm } from "@/lib/works/work-publish-form-state";
import { WorkPublishView } from "./WorkPublishView";

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

    expect(screen.getByText(/ACE metadata preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & editions/i)).toBeInTheDocument();
    expect(screen.getByText(/Leave blank to register the work on-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/copy #1 versus copy #145/i)).toBeInTheDocument();
    expect(screen.getByText(/Register on-chain/i)).toBeInTheDocument();
  });
});
