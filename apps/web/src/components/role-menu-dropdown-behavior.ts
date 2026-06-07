export type PointerEventTarget = Document | Pick<Document, "addEventListener" | "removeEventListener">;

export function closeParentDetails(element: HTMLElement) {
  const details = element.closest("details");

  if (details instanceof HTMLDetailsElement) {
    details.open = false;
  }
}

export function bindOutsideClose(
  details: HTMLDetailsElement,
  eventTarget: PointerEventTarget = document,
) {
  function handlePointerDown(event: PointerEvent) {
    if (!details.open) {
      return;
    }

    const target = event.target;

    if (target instanceof Node && !details.contains(target)) {
      details.open = false;
    }
  }

  eventTarget.addEventListener("pointerdown", handlePointerDown);

  return () => {
    eventTarget.removeEventListener("pointerdown", handlePointerDown);
  };
}
