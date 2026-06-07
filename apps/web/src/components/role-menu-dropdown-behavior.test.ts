/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindOutsideClose,
  closeParentDetails,
} from "./role-menu-dropdown-behavior";

describe("role menu dropdown behavior", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("closes the parent details element", () => {
    document.body.innerHTML = `
      <details open>
        <summary>Menu</summary>
        <button id="item" type="button">Item</button>
      </details>
    `;

    const item = document.getElementById("item");
    const details = document.querySelector("details");

    expect(item).toBeInstanceOf(HTMLElement);
    expect(details).toBeInstanceOf(HTMLDetailsElement);
    expect(details?.open).toBe(true);

    closeParentDetails(item as HTMLElement);

    expect(details?.open).toBe(false);
  });

  it("closes details when pointerdown happens outside", () => {
    document.body.innerHTML = `
      <button id="outside" type="button">Outside</button>
      <details id="menu" open>
        <summary>Menu</summary>
        <div>Panel</div>
      </details>
    `;

    const details = document.getElementById("menu") as HTMLDetailsElement;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const eventTarget = {
      addEventListener,
      removeEventListener,
    };

    const unbind = bindOutsideClose(details, eventTarget);
    const handler = addEventListener.mock.calls[0]?.[1] as (
      event: PointerEvent,
    ) => void;

    handler({ target: outside } as PointerEvent);

    expect(details.open).toBe(false);

    unbind();

    expect(removeEventListener).toHaveBeenCalledWith(
      "pointerdown",
      handler,
    );
  });

  it("keeps details open for pointerdown inside the menu", () => {
    document.body.innerHTML = `
      <details id="menu" open>
        <summary>Menu</summary>
        <button id="inside" type="button">Inside</button>
      </details>
    `;

    const details = document.getElementById("menu") as HTMLDetailsElement;
    const inside = document.getElementById("inside") as HTMLButtonElement;
    const addEventListener = vi.fn();
    const eventTarget = {
      addEventListener,
      removeEventListener: vi.fn(),
    };

    bindOutsideClose(details, eventTarget);
    const handler = addEventListener.mock.calls[0]?.[1] as (
      event: PointerEvent,
    ) => void;

    handler({ target: inside } as PointerEvent);

    expect(details.open).toBe(true);
  });
});
