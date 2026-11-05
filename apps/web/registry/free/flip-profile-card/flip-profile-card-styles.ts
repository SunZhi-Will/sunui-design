// 移植自 CardFlow globals.css：類別改成 fpc- 前綴，宣告順序照原檔，讓偽元素的層疊結果一致
// 差異：hover 規則只在精準指標裝置生效；reduced motion 關掉無限循環動畫
// 去 AI 感：拿掉彩色外發光（0 0 Npx 彩色陰影）與藍紫粉光源，光影只留同色的白色材質光
export const FLIP_PROFILE_CARD_CSS = `
.fpc-perspective { perspective: 1000px; perspective-origin: center center; }
.fpc-3d { transform-style: preserve-3d; }
.fpc-backface { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.fpc-rotate-y-180 { transform: rotateY(180deg); }

@keyframes fpc-gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes fpc-liquid-flow { 0% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } 100% { background-position: 0% 0%; } }

.fpc-card-hover { transition: box-shadow 0.3s ease; }

/* 玻璃擬態 */
.fpc-glass-front {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px) saturate(180%) brightness(1.1);
  -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.1);
}
.fpc-glass-back {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(25px) saturate(200%) brightness(1.2);
  -webkit-backdrop-filter: blur(25px) saturate(200%) brightness(1.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.08);
}
.fpc-glass-front::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 100%);
  border-radius: inherit; pointer-events: none; z-index: 1;
}
.fpc-glass-back::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 40%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 25%, transparent 100%);
  border-radius: inherit; pointer-events: none; z-index: 0; transform: translateZ(0);
}
.fpc-glass-dynamic { position: relative; overflow: hidden; }
.fpc-glass-dynamic::after {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at var(--light-x, 50%) var(--light-y, 50%), rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 70%);
  opacity: 0; transition: opacity 0.3s ease; pointer-events: none; z-index: 1; transform: translateZ(0);
}
.fpc-glass-liquid {
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.1) 100%);
  background-size: 200% 200%;
  animation: fpc-liquid-flow 8s ease-in-out infinite;
}
.fpc-glass-preview-front {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(10px) saturate(150%); -webkit-backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.fpc-glass-preview-back {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.fpc-glass-decoration {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(15px) saturate(120%); -webkit-backdrop-filter: blur(15px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.fpc-glass-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.95); font-weight: 500;
}

/* 動態追蹤：光線 + 高光反射點 */
.fpc-light-tracker { position: relative; overflow: hidden; }
.fpc-light-tracker::before {
  content: ''; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
  background:
    radial-gradient(circle 60px at var(--highlight-x, 20%) var(--highlight-y, 20%), rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%),
    radial-gradient(circle at var(--light-x, 50%) var(--light-y, 50%), rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 15%, rgba(255, 255, 255, 0.1) 30%, transparent 60%);
  opacity: var(--light-intensity, 0); transition: opacity 0.3s ease; pointer-events: none; z-index: 2;
  will-change: opacity; border-radius: inherit; filter: blur(8px);
}
/* 邊緣光暈 */
.fpc-edge-glow {
  position: relative;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0), inset 0 0 0 1px rgba(255, 255, 255, 0);
  transition: box-shadow 0.3s ease;
}
/* 反射光 */
.fpc-reflection { position: relative; }
.fpc-reflection::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 0.1) 40%, transparent 70%);
  border-radius: inherit; opacity: var(--reflection-opacity, 0.6); pointer-events: none; z-index: 3;
  transform: translateY(var(--reflection-offset, 0)); transition: opacity 0.3s ease, transform 0.3s ease;
}
/* 多層次陰影 */
.fpc-multi-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

/* 斜光影：跟著角度轉動的光帶 */
.fpc-light-diagonal { position: relative; overflow: hidden; }
.fpc-light-diagonal::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(var(--diagonal-angle, 135deg),
    transparent 0%,
    transparent calc(var(--diagonal-start, 30%) - 10%),
    rgba(255, 255, 255, 0.8) var(--diagonal-start, 30%),
    rgba(255, 255, 255, 0.6) calc(var(--diagonal-start, 30%) + 5%),
    rgba(255, 255, 255, 0.4) calc(var(--diagonal-start, 30%) + 10%),
    rgba(255, 255, 255, 0.2) calc(var(--diagonal-start, 30%) + 15%),
    transparent calc(var(--diagonal-start, 30%) + 25%));
  background-size: 200% 200%; background-position: var(--diagonal-x, 50%) var(--diagonal-y, 50%);
  opacity: var(--diagonal-intensity, 0.7); pointer-events: none; z-index: 2; border-radius: inherit; filter: blur(8px);
  transition: opacity 0.15s ease, background-position 0.15s ease; will-change: opacity, background-position;
}

/* 中心光：獨立元素 */
.fpc-light-center { position: relative; overflow: hidden; }
.fpc-center-light {
  position: absolute; top: 0; left: 0; width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 25%, rgba(255, 255, 255, 0.2) 40%, transparent 60%);
  opacity: var(--center-intensity, 0.6); pointer-events: none; z-index: 5; border-radius: 50%; filter: blur(15px);
  transform: translate(var(--center-x-px, 160px), var(--center-y-px, 192px)) translate(-50%, -50%) translateZ(0);
  will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden;
}

/* 頂部光：獨立元素 */
.fpc-light-top { position: relative; overflow: hidden; }
.fpc-top-light {
  position: absolute; top: 0; left: 0; right: 0; width: 100%; height: 45%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 25%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 70%, transparent 100%),
    radial-gradient(ellipse 80% 100% at var(--top-x, 50%) 0%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
  background-blend-mode: overlay; opacity: var(--top-intensity, 0.7); pointer-events: none; z-index: 5;
  border-radius: inherit; filter: blur(10px); transform: translateZ(0); transition: opacity 0.2s ease;
}

/* 雙光源：滑鼠位置與對角位置 */
.fpc-light-dual { position: relative; overflow: hidden; }
.fpc-light-dual::before {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background:
    radial-gradient(circle 150px at var(--dual-x1, 20%) var(--dual-y1, 20%), rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 60%),
    radial-gradient(circle 150px at var(--dual-x2, 80%) var(--dual-y2, 80%), rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 60%);
  opacity: var(--dual-intensity, 0.7); pointer-events: none; z-index: 2; border-radius: inherit; filter: blur(12px);
  transition: opacity 0.2s ease; will-change: opacity;
}

/* 漸變光 */
.fpc-light-gradient { position: relative; overflow: hidden; }
.fpc-light-gradient::before {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: linear-gradient(var(--gradient-angle, 45deg), rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.35) 30%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.25) 75%, rgba(255, 255, 255, 0) 100%);
  background-size: 200% 200%; background-position: var(--gradient-x, 50%) var(--gradient-y, 50%);
  opacity: var(--gradient-intensity, 0.6); pointer-events: none; z-index: 2; border-radius: inherit; filter: blur(15px);
  animation: fpc-gradient-shift 8s ease infinite;
  transition: opacity 0.2s ease, background-position 0.2s ease; will-change: opacity, background-position;
}

/* hover 規則：只給精準指標，順序與原檔相同 */
@media (hover: hover) and (pointer: fine) {
  .fpc-glass-dynamic:hover::after { opacity: 1; }
  .fpc-glass-dynamic:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%);
    backdrop-filter: blur(25px) saturate(200%) brightness(1.3);
    -webkit-backdrop-filter: blur(25px) saturate(200%) brightness(1.3);
  }
  .fpc-light-tracker:hover::before { opacity: calc(var(--light-intensity, 0) * 1.5); }
  .fpc-edge-glow:hover {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, calc(var(--edge-glow-intensity, 0.8) * 0.6)),
      inset 0 0 0 1px rgba(255, 255, 255, calc(var(--edge-glow-intensity, 0.8) * 0.3));
  }
  .fpc-reflection:hover::after {
    opacity: calc(var(--reflection-opacity, 0.6) * 1.3);
    transform: translateY(calc(var(--reflection-offset, 0) - 2px));
  }
  .fpc-multi-shadow:hover {
    box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.1), 0 20px 30px -6px rgba(0, 0, 0, 0.1);
  }
  .fpc-light-diagonal:hover::before { opacity: calc(var(--diagonal-intensity, 0.7) * 1.4); filter: blur(10px); }
  .fpc-light-center:hover .fpc-center-light { opacity: calc(var(--center-intensity, 0.6) * 1.3); }
  .fpc-light-top:hover .fpc-top-light { opacity: calc(var(--top-intensity, 0.7) * 1.3); }
  .fpc-light-dual:hover::before { opacity: calc(var(--dual-intensity, 0.7) * 1.3); }
  .fpc-light-gradient:hover::before { opacity: calc(var(--gradient-intensity, 0.6) * 1.4); animation-duration: 4s; }
}

/* 鍵盤焦點：隱藏的翻面按鈕取得焦點時，在卡片外圍畫框 */
.fpc-root:has(> .fpc-flip-btn:focus-visible) { outline: 2px solid var(--ring, currentColor); outline-offset: 4px; border-radius: 0.75rem; }

/* 中性卡面（paper 主題）：白色材質光改用 soft-light 疊加，靜止時不顯示，只在游標靠近時出現淡淡光澤；不加上半部反光 */
.fpc-paper::before, .fpc-paper .fpc-top-light, .fpc-paper .fpc-center-light { mix-blend-mode: soft-light; opacity: calc(var(--light-intensity, 0) * 0.35) !important; }
.fpc-paper::after { display: none; }

@media (prefers-reduced-motion: reduce) {
  .fpc-glass-liquid, .fpc-light-gradient::before { animation: none; }
}
`;
