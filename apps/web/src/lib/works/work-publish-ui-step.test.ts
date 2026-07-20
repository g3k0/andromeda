import { describe, expect, it } from "vitest";

import { resolveWorkPublishUiStep } from "./work-publish-ui-step";

describe("resolveWorkPublishUiStep", () => {
  it("keeps success and labeling steps visible while the receipt is still confirming", () => {
    expect(resolveWorkPublishUiStep("success", true)).toBe("success");
    expect(resolveWorkPublishUiStep("labeling_copies", true)).toBe(
      "labeling_copies",
    );
  });

  it("shows registering while waiting for the on-chain receipt", () => {
    expect(resolveWorkPublishUiStep("registering", true)).toBe("registering");
  });

  it("returns the underlying step when receipt confirmation finished", () => {
    expect(resolveWorkPublishUiStep("ready", false)).toBe("ready");
    expect(resolveWorkPublishUiStep("registering", false)).toBe("registering");
  });
});
