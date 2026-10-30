"use client";

import { useEffect, useMemo, useState } from "react";

import { useRemoteLink } from "@/components/use-remote-link";
import {
  buildFocusMap,
  firstFocusKey,
  focusMapHas,
  moveFocus,
  type Direction,
} from "@/lib/focus";
import type { HomeDesign } from "@/lib/design";
import { clockWaitingForInput } from "@/lib/tv-visibility";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return Boolean(
    target.closest("[data-slot='slider'], [role='slider'], [role='switch']"),
  );
}

function directionFromKey(key: string): Direction | null {
  switch (key) {
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    default:
      return null;
  }
}

export function useTvRemote(
  design: HomeDesign | null,
  onConfirm: (key: string) => void,
  onEscape?: () => void,
  followPhone = false,
) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const map = useMemo(
    () => (design ? buildFocusMap(design) : null),
    [design],
  );
  const activeKey =
    map && focusKey && focusMapHas(map, focusKey)
      ? focusKey
      : map
        ? firstFocusKey(map)
        : null;

  useEffect(() => {
    if (!design || !map) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[role='dialog'], [data-appearance-panel]")) {
        return;
      }
      if (isTypingTarget(target)) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }
      const direction = directionFromKey(event.key);
      if (direction && map) {
        event.preventDefault();
        const waiting = clockWaitingForInput(design!);
        window.dispatchEvent(new Event("tv-reveal-apps"));
        const next = waiting ? firstFocusKey(map) : moveFocus(map, activeKey, direction);
        if (!next) {
          return;
        }
        setFocusKey(next);
        const node = document.querySelector(
          `[data-focus-key="${CSS.escape(next)}"]`,
        );
        if (node instanceof HTMLElement) {
          node.focus({ preventScroll: true });
          node.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        return;
      }
      if (event.key === "Enter" && activeKey) {
        if (clockWaitingForInput(design!)) return;
        const element = target instanceof HTMLElement ? target : null;
        const editorControl = element?.closest("button, a");
        const onScreen = element?.closest("[data-tv-item]");
        if (editorControl && !onScreen) {
          return;
        }
        event.preventDefault();
        onConfirm(activeKey);
      }
    }
    // Read the clock's hidden state before its bubble listener reveals the dock.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [activeKey, design, map, onConfirm, onEscape]);

  useRemoteLink(followPhone, design, map, activeKey, setFocusKey, onConfirm);

  return { activeKey, setFocusKey };
}
