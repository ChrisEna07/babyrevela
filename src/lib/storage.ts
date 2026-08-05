"use client";

export interface ClientStore<T> {
  read: () => T | null;
  subscribe: (onStoreChange: () => void) => () => void;
  set: (value: T | null) => void;
  getServerSnapshot: () => T | null;
}

export function createClientStore<T>(key: string): ClientStore<T> {
  let cached: T | null | undefined = undefined;
  const listeners = new Set<() => void>();

  function read(): T | null {
    if (cached !== undefined) return cached;
    try {
      const raw = window.localStorage.getItem(key);
      cached = raw ? (JSON.parse(raw) as T) : null;
    } catch {
      cached = null;
    }
    return cached;
  }

  function subscribe(onStoreChange: () => void): () => void {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }

  function set(value: T | null) {
    cached = value;
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // almacenamiento no disponible en este contexto
    }
    for (const listener of listeners) listener();
  }

  return { read, subscribe, set, getServerSnapshot: () => null };
}
