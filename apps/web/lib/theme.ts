/** 網站主題存在 localStorage 的 key。layout 的內嵌腳本與頁首 ThemeMenu 共用。 */
export const THEME_STORAGE_KEY = "sunui-theme";

/**
 * 預設深色（2026-11-19）：使用者沒選過主題時用深色，不跟系統。放在 themeScript 之後。
 * 網站與預覽 iframe 的 layout 都要放，兩邊才一致；使用者手動切換後照他的選擇。
 */
export function defaultDarkScript(storageKey = THEME_STORAGE_KEY) {
  return `(()=>{let s=null;try{s=localStorage.getItem(${JSON.stringify(storageKey)})}catch(e){}if(s!=="light"&&s!=="dark"){const r=document.documentElement;r.classList.add("dark");r.style.colorScheme="dark"}})()`;
}
