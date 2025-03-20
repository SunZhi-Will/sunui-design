try{
(()=>{var u=__STORYBOOK_API__,{ActiveTabs:c,Consumer:h,ManagerContext:b,Provider:g,RequestResponseError:S,addons:o,combineParameters:_,controlOrMetaKey:x,controlOrMetaSymbol:T,eventMatchesShortcut:y,eventToShortcut:C,experimental_MockUniversalStore:O,experimental_UniversalStore:B,experimental_requestResponse:R,experimental_useUniversalStore:A,isMacLike:v,isShortcutTaken:I,keyToSymbol:M,merge:E,mockChannel:k,optionOrAltSymbol:P,shortcutMatchesShortcut:U,shortcutToHumanString:K,types:w,useAddonState:G,useArgTypes:Y,useArgs:D,useChannel:H,useGlobalTypes:q,useGlobals:z,useParameter:N,useSharedState:L,useStoryPrepared:j,useStorybookApi:F,useStorybookState:J}=__STORYBOOK_API__;var Z=__STORYBOOK_THEMING_CREATE__,{create:a,themes:$}=__STORYBOOK_THEMING_CREATE__;var i=a({base:"light",brandTitle:"SunUI Design",brandUrl:"https://github.com/sunzhi-will/",brandImage:"/sunui-title-logo.png",brandTarget:"_self",colorPrimary:"#f97316",colorSecondary:"#f97316",appBg:"#ffffff",appContentBg:"#ffffff",appBorderColor:"#e2e8f0",appBorderRadius:6,textColor:"#1e293b",textInverseColor:"#ffffff",barTextColor:"#64748b",barSelectedColor:"#f97316",barBg:"#ffffff",inputBg:"#ffffff",inputBorder:"#e2e8f0",inputTextColor:"#1e293b",inputBorderRadius:4}),n=document.createElement("style");n.textContent=`
  .sidebar-header {
    display: flex !important;
    align-items: center !important;
    padding-right: 15px !important;
    padding-bottom: 15px !important;
    padding-left: 15px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .sidebar-header img {
    height: 32px !important;
    width: auto !important;
    margin-right: 10px !important;
  }
  .sidebar-header a[title="SunUI Design"] {
    display: flex !important;
    align-items: center !important;
    font-size: 20px !important;
    font-weight: 600 !important;
    color: #1e293b !important;
    text-decoration: none !important;
  }
  .sidebar-header a[title="SunUI Design"]:hover {
    color: #f97316 !important;
  }
`;document.head.appendChild(n);o.setConfig({theme:i,enableShortcuts:!0,showToolbar:!0});})();
}catch(e){ console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e); }
