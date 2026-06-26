"use client";

import { useSyncExternalStore } from "react";

const MOBILE_LAYOUT_QUERY = "(max-width: 960px)";

function subscribeToMobileLayout(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getMobileLayoutSnapshot(): boolean {
  return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
}

function getMobileLayoutServerSnapshot(): boolean {
  return false;
}

export function useMobileLayout(): boolean {
  return useSyncExternalStore(
    subscribeToMobileLayout,
    getMobileLayoutSnapshot,
    getMobileLayoutServerSnapshot,
  );
}
