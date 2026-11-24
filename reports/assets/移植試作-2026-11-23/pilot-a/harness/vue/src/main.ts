import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
const l = new URLSearchParams(location.search).get("l") || "en";
(globalThis as any).__sunuiLocale = l;
document.documentElement.lang = l;
const app = createApp(App);
app.config.globalProperties.$l = l;
app.mount("#app");
