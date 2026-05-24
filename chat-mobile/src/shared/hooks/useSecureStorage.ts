import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

const isWeb = typeof window !== "undefined";

async function canUseSecureStore(): Promise<boolean> {
  if (isWeb) {
    return false;
  }

  return SecureStore.isAvailableAsync();
}

async function readItem(key: string): Promise<string | null> {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(key);
  }

  if (isWeb) {
    return window.localStorage.getItem(key);
  }

  return null;
}

async function writeItem(key: string, value: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  if (isWeb) {
    window.localStorage.setItem(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (isWeb) {
    window.localStorage.removeItem(key);
  }
}

export function useSecureStorage() {
  const getItem = useCallback(async (key: string) => readItem(key), []);
  const setItem = useCallback(async (key: string, value: string) => {
    await writeItem(key, value);
  }, []);
  const deleteItem = useCallback(async (key: string) => {
    await removeItem(key);
  }, []);

  return {
    getItem,
    setItem,
    deleteItem,
  };
}

export const secureStorage = {
  getItem: readItem,
  setItem: writeItem,
  deleteItem: removeItem,
};
