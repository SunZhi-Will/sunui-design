"use client";

import { useCallback, useSyncExternalStore } from "react";

// 收藏的區塊只存在這個瀏覽器（無帳號）。名稱陣列，順序就是收藏順序，複製 prompt 時照這個順序組頁。
// localStorage 在無痕視窗或被封鎖時會丟例外，讀寫都包 try/catch，失敗就當成空清單、只留在記憶體。

const key = "sunui:saved";
const changeEvent = "sunui:saved-change";
const empty: string[] = [];

let memory: string[] = empty;
let cachedRaw: string | null = null;
let cachedList: string[] = empty;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return memory;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : empty;
  } catch {
    cachedList = empty;
  }
  return cachedList;
}

function write(list: string[]) {
  memory = list;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // 存不進去就只留在這次瀏覽
  }
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(onChange: () => void) {
  // storage 事件同步其他分頁，自訂事件同步同一頁的其他卡片
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function useSaved() {
  const saved = useSyncExternalStore(subscribe, read, () => empty);
  const toggle = useCallback((name: string) => {
    const list = read();
    write(list.includes(name) ? list.filter((n) => n !== name) : [...list, name]);
  }, []);
  const clear = useCallback(() => write(empty), []);
  return { saved, toggle, clear };
}
