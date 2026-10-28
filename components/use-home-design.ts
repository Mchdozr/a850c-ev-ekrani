"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  STORAGE_KEY,
  createDefaultDesign,
  parseDesign,
  type HomeDesign,
} from "@/lib/design";

const CHANGE_EVENT = "a850c-design-change";
const EMPTY_TOKEN = "DEFAULT";

function subscribe(onStoreChange: () => void) {
  const notify = () => onStoreChange();
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

function readToken(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && raw.length > 0 ? raw : EMPTY_TOKEN;
  } catch {
    return EMPTY_TOKEN;
  }
}

export function writeDesign(design: HomeDesign) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useHomeDesign() {
  const token = useSyncExternalStore(subscribe, readToken, () => "");
  const ready = token !== "";
  const parsed = useMemo(() => {
    if (!ready) {
      return { design: null, note: null as string | null };
    }
    if (token === EMPTY_TOKEN) {
      return { design: createDefaultDesign(), note: null };
    }
    try {
      return { design: parseDesign(JSON.parse(token)), note: null };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kayıtlı tasarım okunamadı.";
      return {
        design: createDefaultDesign(),
        note: `Kayıtlı tasarım açılamadı (${message}) Örnek salon ekranı gösteriliyor.`,
      };
    }
  }, [ready, token]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const setDesign = useCallback((next: HomeDesign) => {
    try {
      writeDesign(next);
      setSaveError(null);
    } catch {
      setSaveError(
        "Tasarım bu tarayıcıya sığmadı. Duvar görselini kaldırıp yeniden deneyin.",
      );
    }
  }, []);

  return {
    ready,
    design: parsed.design,
    loadNote: parsed.note,
    saveError,
    setDesign,
  };
}
