import { mount } from "svelte";
import App from "./App.svelte";
import "./style.css";
const l = new URLSearchParams(location.search).get("l") || "en";
(globalThis as any).__sunuiLocale = l;
document.documentElement.lang = l;
mount(App, { target: document.getElementById("app")! });
