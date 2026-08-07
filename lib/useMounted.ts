import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// false durante el SSR y el primer render del cliente; true tras el montaje.
// Evita hydration mismatches cuando el render depende de localStorage.
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
