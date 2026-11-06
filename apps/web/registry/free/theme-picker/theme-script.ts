// Plain module with no client directive: it runs on the server, so a root layout can inline it.
//   <head><script dangerouslySetInnerHTML={{ __html: themeScript("theme") }} /></head>
// It applies the saved theme before the first paint, and follows changes made in
// other tabs and in same-origin iframes. Use the same storageKey as useThemeMode().

export function themeScript(storageKey = "theme") {
  const k = JSON.stringify(storageKey);
  return `(()=>{const a=m=>{const r=document.documentElement;r.classList.remove("light","dark");if(m==="light"||m==="dark"){r.classList.add(m);r.style.colorScheme=m}else{r.style.colorScheme=""}};try{a(localStorage.getItem(${k}))}catch(e){}addEventListener("storage",e=>{if(e.key===${k})a(e.newValue)})})()`;
}
