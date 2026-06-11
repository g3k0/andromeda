import { describe, expect, it, vi } from "vitest";
import { ensureAdminSession } from "./admin-users-session";

describe("ensureAdminSession", () => {
  it("skips signing when an admin session is already ready", async () => {
    const getStatus = vi.fn().mockResolvedValue({ active: true });
    const isReady = vi.fn().mockResolvedValue(true);
    const sign = vi.fn();
    const establish = vi.fn();

    await ensureAdminSession("0xabc", vi.fn(), {
      getStatus,
      isReady,
      sign,
      establish,
    });

    expect(sign).not.toHaveBeenCalled();
    expect(establish).not.toHaveBeenCalled();
  });

  it("establishes a session when none is active", async () => {
    const getStatus = vi.fn().mockResolvedValue({ active: false });
    const isReady = vi.fn().mockResolvedValue(false);
    const sign = vi.fn().mockResolvedValue({
      address: "0xabc",
      message: "message",
      signature: "0x1234",
    });
    const establish = vi.fn().mockResolvedValue({ active: true });

    await ensureAdminSession("0xabc", vi.fn(), {
      getStatus,
      isReady,
      sign,
      establish,
    });

    expect(sign).toHaveBeenCalledOnce();
    expect(establish).toHaveBeenCalledWith({
      address: "0xabc",
      message: "message",
      signature: "0x1234",
    });
  });

  it("re-establishes a session when the active session is not admin-ready", async () => {
    const getStatus = vi.fn().mockResolvedValue({ active: true });
    const isReady = vi.fn().mockResolvedValue(false);
    const sign = vi.fn().mockResolvedValue({
      address: "0xabc",
      message: "message",
      signature: "0x1234",
    });
    const establish = vi.fn().mockResolvedValue({ active: true });

    await ensureAdminSession("0xabc", vi.fn(), {
      getStatus,
      isReady,
      sign,
      establish,
    });

    expect(sign).toHaveBeenCalledOnce();
    expect(establish).toHaveBeenCalledOnce();
  });
});
