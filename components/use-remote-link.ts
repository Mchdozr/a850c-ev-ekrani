"use client";

import { useEffect, useRef } from "react";

import type { HomeDesign } from "@/lib/design";
import { focusKeyForMark, moveFocus, type FocusMap } from "@/lib/focus";
import { readSnapshot, type RemoteCommand } from "@/lib/remote";

export function useRemoteLink(
  enabled: boolean,
  design: HomeDesign | null,
  map: FocusMap | null,
  activeKey: string | null,
  setFocusKey: (key: string) => void,
  onConfirm: (key: string) => void,
) {
  const designRef = useRef(design);
  const mapRef = useRef(map);
  const activeRef = useRef(activeKey);
  const confirmRef = useRef(onConfirm);
  const setRef = useRef(setFocusKey);

  useEffect(() => {
    designRef.current = design;
    mapRef.current = map;
    activeRef.current = activeKey;
    confirmRef.current = onConfirm;
    setRef.current = setFocusKey;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let stopped = false;
    let seen = 0;
    let timer = 0;

    const reveal = (key: string) => {
      const node = document.querySelector(
        `[data-focus-key="${CSS.escape(key)}"]`,
      );
      if (node instanceof HTMLElement) {
        node.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    const step = (
      command: RemoteCommand,
      current: string | null,
    ): string | null => {
      const currentDesign = designRef.current;
      const currentMap = mapRef.current;
      if (!currentDesign || !currentMap) {
        return current;
      }
      switch (command) {
        case "enter":
          return current;
        case "youtube":
        case "netflix":
          return focusKeyForMark(currentDesign, command) ?? current;
        case "up":
        case "down":
        case "left":
        case "right":
          return moveFocus(currentMap, current, command);
        default: {
          const exhaustive: never = command;
          return exhaustive;
        }
      }
    };

    const tick = async () => {
      if (stopped) {
        return;
      }
      try {
        const response = await fetch("/api/kumanda", { cache: "no-store" });
        if (response.ok && designRef.current && mapRef.current) {
          const snapshot = readSnapshot(await response.json());
          if (snapshot) {
            const pending = snapshot.recent
              .filter((entry) => entry.seq > seen)
              .sort((left, right) => left.seq - right.seq);
            if (pending.length > 0) {
              let cursor = activeRef.current;
              for (const entry of pending) {
                seen = Math.max(seen, entry.seq);
                if (entry.command === "enter") {
                  if (cursor) {
                    confirmRef.current(cursor);
                  }
                  continue;
                }
                const next = step(entry.command, cursor);
                if (next) {
                  cursor = next;
                }
              }
              if (cursor && cursor !== activeRef.current) {
                activeRef.current = cursor;
                setRef.current(cursor);
                reveal(cursor);
              }
            } else if (snapshot.seq > seen) {
              seen = snapshot.seq;
            }
          }
        }
        await fetch("/api/kumanda", {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            role: "tv",
            focusKey: activeRef.current,
            ackSeq: seen,
          }),
        });
      } catch {
        // The phone surfaces its own failed command. The television retries.
      } finally {
        if (!stopped) {
          timer = window.setTimeout(() => {
            void tick();
          }, 400);
        }
      }
    };

    timer = window.setTimeout(() => {
      void tick();
    }, 40);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);
}
