import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/global/ui/tooltip";
import ThreePillarPrototypePage from "@/prototype/three-pillar/ThreePillarPrototypePage";

type MediaChangeListener = (event: MediaQueryListEvent) => void;
const mediaListeners = new Set<{ query: string; listener: MediaChangeListener }>();
let polyfillsInstalled = false;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function matchesPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === "string") return value.includes(pattern);
  if (pattern.global) pattern.lastIndex = 0;
  return pattern.test(value);
}

function evaluateMediaQuery(query: string): boolean {
  const width = window.innerWidth;
  const minMatch = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/i.exec(query);
  const maxMatch = /\(max-width:\s*(\d+(?:\.\d+)?)px\)/i.exec(query);
  if (!minMatch && !maxMatch) return false;
  return (minMatch ? width >= Number(minMatch[1]) : true) && (maxMatch ? width <= Number(maxMatch[1]) : true);
}

function notifyMediaListeners(): void {
  for (const entry of mediaListeners) {
    entry.listener({ matches: evaluateMediaQuery(entry.query), media: entry.query } as MediaQueryListEvent);
  }
}

export function installPrototypeTestPolyfills(): void {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (polyfillsInstalled) return;
  polyfillsInstalled = true;

  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      get matches(): boolean { return evaluateMediaQuery(query); },
      media: query,
      onchange: null,
      addEventListener: (_t: string, cb: EventListenerOrEventListenerObject) => {
        if (typeof cb === "function") mediaListeners.add({ query, listener: cb as MediaChangeListener });
      },
      removeEventListener: (_t: string, cb: EventListenerOrEventListenerObject) => {
        for (const e of mediaListeners) if (e.listener === cb) mediaListeners.delete(e);
      },
      addListener: (cb: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null) => {
        if (cb) mediaListeners.add({ query, listener: cb as MediaChangeListener });
      },
      removeListener: (cb: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null) => {
        for (const e of mediaListeners) if (e.listener === cb) mediaListeners.delete(e);
      },
      dispatchEvent: () => false,
    }),
  });
  window.addEventListener("resize", notifyMediaListeners);

  if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = () => {};
  if (typeof Element.prototype.hasPointerCapture !== "function") Element.prototype.hasPointerCapture = () => false;
  if (typeof Element.prototype.setPointerCapture !== "function") Element.prototype.setPointerCapture = () => {};
  if (typeof Element.prototype.releasePointerCapture !== "function") Element.prototype.releasePointerCapture = () => {};
  if (typeof URL.createObjectURL !== "function") URL.createObjectURL = () => "blob:prototype-test-object-url";
  if (typeof URL.revokeObjectURL !== "function") URL.revokeObjectURL = () => {};
}

export function resetPrototypeTestDom(): void {
  const rootEl = document.documentElement;
  rootEl.removeAttribute("data-theme");
  rootEl.removeAttribute("data-density");
  rootEl.removeAttribute("data-motion");
  for (let i = rootEl.style.length - 1; i >= 0; i -= 1) {
    const prop = rootEl.style.item(i);
    if (prop.startsWith("--vk-")) rootEl.style.removeProperty(prop);
  }
  localStorage.clear();
  sessionStorage.clear();
}

export async function setTestViewportWidth(width: 360 | 768 | 1280): Promise<void> {
  await act(async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
}

export async function mountPrototypePage(
  initialPath = "/prototype",
): Promise<{ container: HTMLDivElement; unmount: () => Promise<void> }> {
  installPrototypeTestPolyfills();
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root | null = null;
  await act(async () => {
    root = createRoot(container);
    root.render(
      createElement(MemoryRouter, { initialEntries: [initialPath] },
        createElement(TooltipProvider, null, createElement(ThreePillarPrototypePage)),
      ),
    );
  });
  return {
    container,
    unmount: async () => {
      await act(async () => { root?.unmount(); });
      container.remove();
    },
  };
}

export async function clickElement(el: Element): Promise<void> {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    if (el instanceof HTMLElement) { el.focus(); el.click(); }
    else el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  });
}

export function findAllByText(pattern: string | RegExp, selector = "*", root: ParentNode = document.body): HTMLElement[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE" && matchesPattern(normalizeText(el.textContent), pattern),
  );
  return candidates.filter((el) =>
    !Array.from(el.querySelectorAll<HTMLElement>(selector)).some(
      (child) => child !== el && matchesPattern(normalizeText(child.textContent), pattern),
    ),
  );
}

export function queryByText(pattern: string | RegExp, selector = "*", root: ParentNode = document.body): HTMLElement | null {
  return findAllByText(pattern, selector, root)[0] ?? null;
}

export function findByText(pattern: string | RegExp, selector = "*", root: ParentNode = document.body): HTMLElement {
  const match = queryByText(pattern, selector, root);
  if (!match) throw new Error(`Element not found for text: ${String(pattern)} (selector: ${selector})`);
  return match;
}

export async function clickByText(pattern: string | RegExp, selector?: string, root: ParentNode = document.body): Promise<HTMLElement> {
  const interactive = "button, [role='button'], [role='tab'], [role='menuitem'], [role='option'], a";
  const target = selector ? findByText(pattern, selector, root) : queryByText(pattern, interactive, root) ?? findByText(pattern, "*", root);
  await clickElement(target);
  return target;
}

export async function clickByAriaLabel(label: string | RegExp, root: ParentNode = document.body): Promise<HTMLElement> {
  const target = Array.from(root.querySelectorAll<HTMLElement>("[aria-label]")).find((el) =>
    matchesPattern(normalizeText(el.getAttribute("aria-label")), label),
  );
  if (!target) throw new Error(`Element not found for aria-label: ${String(label)}`);
  await clickElement(target);
  return target;
}

export async function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  await act(async () => {
    el.focus();
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

export function findInputByPlaceholderOrLabel(pattern: string | RegExp, root: ParentNode = document.body): HTMLInputElement | HTMLTextAreaElement {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));
  const direct = inputs.find((el) =>
    matchesPattern(normalizeText(el.placeholder), pattern) || matchesPattern(normalizeText(el.getAttribute("aria-label")), pattern),
  );
  if (direct) return direct;
  for (const labelEl of Array.from(root.querySelectorAll<HTMLLabelElement>("label"))) {
    if (!matchesPattern(normalizeText(labelEl.textContent), pattern)) continue;
    const byFor = labelEl.htmlFor ? inputs.find((el) => el.id === labelEl.htmlFor) : undefined;
    const target = byFor ?? labelEl.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
    if (target) return target;
  }
  const byLabelledBy = inputs.find((el) => {
    const id = el.getAttribute("aria-labelledby");
    const refEl = id ? document.getElementById(id) : null;
    return refEl ? matchesPattern(normalizeText(refEl.textContent), pattern) : false;
  });
  if (byLabelledBy) return byLabelledBy;
  throw new Error(`Input or textarea not found for placeholder/label: ${String(pattern)}`);
}
