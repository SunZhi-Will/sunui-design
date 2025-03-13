import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'SunUI Design',
  brandUrl: 'https://github.com/sunzhi-will/',
  brandImage: '/sunui-title-logo.png',
  brandTarget: '_self',

  // UI 主題色調
  colorPrimary: '#f97316',
  colorSecondary: '#f97316',

  // UI 控件顏色
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e2e8f0',
  appBorderRadius: 6,

  // 文字顏色
  textColor: '#1e293b',
  textInverseColor: '#ffffff',

  // 工具欄顏色
  barTextColor: '#64748b',
  barSelectedColor: '#f97316',
  barBg: '#ffffff',

  // 輸入框樣式
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  inputTextColor: '#1e293b',
  inputBorderRadius: 4,
});

// 自定義 CSS 樣式
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

addons.setConfig({
  theme,
  enableShortcuts: true,
  showToolbar: true,
}); 