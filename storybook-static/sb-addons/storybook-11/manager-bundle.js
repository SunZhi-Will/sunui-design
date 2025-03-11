try{
(()=>{var u=__STORYBOOK_API__,{ActiveTabs:c,Consumer:h,ManagerContext:b,Provider:g,RequestResponseError:S,addons:r,combineParameters:_,controlOrMetaKey:x,controlOrMetaSymbol:T,eventMatchesShortcut:y,eventToShortcut:C,experimental_requestResponse:O,isMacLike:B,isShortcutTaken:R,keyToSymbol:A,merge:I,mockChannel:E,optionOrAltSymbol:M,shortcutMatchesShortcut:P,shortcutToHumanString:k,types:v,useAddonState:K,useArgTypes:w,useArgs:G,useChannel:U,useGlobalTypes:Y,useGlobals:D,useParameter:H,useSharedState:q,useStoryPrepared:z,useStorybookApi:N,useStorybookState:L}=__STORYBOOK_API__;var V=__STORYBOOK_THEMING_CREATE__,{create:a,themes:W}=__STORYBOOK_THEMING_CREATE__;var i=a({base:"light",brandTitle:"SunUI Design",brandUrl:"https://github.com/sunzhi-will/sunui",brandImage:"/sunui-title-logo.png",brandTarget:"_self",colorPrimary:"#f97316",colorSecondary:"#f97316",appBg:"#ffffff",appContentBg:"#ffffff",appBorderColor:"#e2e8f0",appBorderRadius:6,textColor:"#1e293b",textInverseColor:"#ffffff",barTextColor:"#64748b",barSelectedColor:"#f97316",barBg:"#ffffff",inputBg:"#ffffff",inputBorder:"#e2e8f0",inputTextColor:"#1e293b",inputBorderRadius:4}),n=document.createElement("style");n.textContent=`
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
`;document.head.appendChild(n);r.setConfig({theme:i,enableShortcuts:!0,showToolbar:!0});})();
}catch(e){ console.error("[Storybook] One of your manager-entries failed: " + import.meta.url, e); }
