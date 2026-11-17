import { useEffect } from "react";

const KEYBOARD_DELTA_PX = 120;

function scrollFocusedElementIntoView() {
  const active = document.activeElement as HTMLElement | null;
  if (!active || active === document.body) return;

  const cmEditor = active.closest(".cm-editor");
  if (cmEditor) {
    const activeLine = cmEditor.querySelector<HTMLElement>(".cm-activeLine");
    if (activeLine) {
      activeLine.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
  }

  const tag = active.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    active.isContentEditable
  ) {
    active.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

/**
 * Tracks mobile/tablet virtual keyboard height via window.visualViewport,
 * updates `--vk-viewport-h` on :root, and scrolls the active cursor/input into view.
 */
export function useVisualViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let prevKeyboardOpen = false;
    let rafId: number | null = null;

    const scheduleScrollToActive = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        scrollFocusedElementIntoView();
        rafId = null;
      });
    };

    const syncViewport = () => {
      const vv = window.visualViewport;
      if (vv && vv.scale > 1.05) return;
      const height = vv ? vv.height : window.innerHeight;
      root.style.setProperty("--vk-viewport-h", `${Math.round(height)}px`);

      const isKeyboardOpen = window.innerHeight - height > KEYBOARD_DELTA_PX;
      if (isKeyboardOpen && !prevKeyboardOpen) {
        scheduleScrollToActive();
      }
      prevKeyboardOpen = isKeyboardOpen;
    };

    const handleFocusIn = () => {
      if (prevKeyboardOpen) scheduleScrollToActive();
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("focusin", handleFocusIn);
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("focusin", handleFocusIn);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      root.style.removeProperty("--vk-viewport-h");
    };
  }, []);
}
