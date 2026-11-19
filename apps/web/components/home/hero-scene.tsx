"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import {
  Card,
  CartCard,
  ChartCard,
  CouponCard,
  OrderCard,
  PriceCard,
  ProductCard,
  StockCard,
  useOnScreen,
  WallActive,
  type Copy,
} from "@/components/home/live-wall";
import { cn } from "@/lib/utils";

/**
 * 首頁開場的場景：即時小卡排成整齊的三欄（等寬、等間距、不重疊），下緣切掉並淡出。中間那一欄留一格空位給太陽。
 * 光源是太陽（sun-dimmer.tsx）：它把自己的位置寫進每張卡的 --lx / --ly（光在卡片座標裡的位置）與 --shx / --shy（影子的偏移），
 * 所以拖太陽時每張卡的亮面、邊緣反光和影子會即時跟著變。卡片就是元件牆的那些（live-wall.tsx），照樣會自己動、可以操作。
 * 欄數：手機一欄、sm 兩欄、md 以上三欄。xl 以上場景在標題右邊，以下在標題上面。
 * 2026-11-20 試過前後交疊、大小不一的散落排法，被否決（太亂）。不要改回去。規範見 SITE-MOTION.md §6。
 */
export function HeroScene({ copy }: { copy: Copy }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useOnScreen(ref);
  const money = (n: number) => `${copy.currency}${n.toLocaleString("en-US")}`;
  const column = "flex-col gap-4";

  return (
    <WallActive.Provider value={active}>
      <div
        ref={ref}
        data-stage
        role="group"
        aria-label={copy.label}
        className="relative -mx-4 grid h-[430px] grid-cols-1 content-start gap-4 overflow-hidden px-4 pt-6 [mask-image:linear-gradient(to_bottom,#000_78%,transparent)] sm:-mx-5 sm:h-[520px] sm:grid-cols-2 sm:px-5 md:grid-cols-3 xl:absolute xl:inset-y-0 xl:right-0 xl:mx-0 xl:h-auto xl:w-[64%] xl:pt-10 xl:pl-0"
      >
        <div className={cn("hidden sm:flex", column)}>
          <Lit>
            <Card className="mb-0">{(auto) => <ProductCard auto={auto} copy={copy} money={money} />}</Card>
          </Lit>
          <Lit>
            <Card className="mb-0" title={copy.stock.ends}>
              {(auto) => <StockCard auto={auto} copy={copy} />}
            </Card>
          </Lit>
          <Lit>
            <Card className="mb-0" title={copy.coupon.label}>
              {(auto) => <CouponCard auto={auto} copy={copy} money={money} />}
            </Card>
          </Lit>
        </div>
        <div className={cn("flex", column)}>
          <Lit>
            <Card className="mb-0" title={copy.price.caption}>
              {(auto) => <PriceCard auto={auto} copy={copy} />}
            </Card>
          </Lit>
          {/* 太陽的位置：格線裡空出來的一格，sun-dimmer 以它的中心當起始點 */}
          <div data-sun-home aria-hidden="true" className="h-[calc(var(--sun-d)+84px)]" />
          <Lit>
            <Card className="mb-0" title={copy.order.title} note={copy.order.eta}>
              {(auto) => <OrderCard auto={auto} steps={copy.order.steps} />}
            </Card>
          </Lit>
        </div>
        <div className={cn("hidden md:flex", column)}>
          <Lit>
            <Card className="mb-0" title={copy.chart.title}>
              {(auto) => <ChartCard auto={auto} copy={copy} money={money} />}
            </Card>
          </Lit>
          <Lit>
            <Card className="mb-0" title={copy.cart.title}>
              {(auto) => <CartCard auto={auto} copy={copy} money={money} />}
            </Card>
          </Lit>
        </div>
      </div>
    </WallActive.Provider>
  );
}

const SPOT = "radial-gradient(520px circle at var(--lx, 50%) var(--ly, -60%), rgb(255 255 255 / var(--a)), transparent 62%)";
const RIM: CSSProperties = {
  background: SPOT,
  padding: 1,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/** 一張被照到的卡：影子往光的反方向落，深色時表面有一塊亮面、朝光的邊緣有反光 */
function Lit({ children }: { children: ReactNode }) {
  return (
    <div
      data-lit
      className="relative rounded-2xl [box-shadow:var(--shx,0px)_var(--shy,12px)_30px_-10px_rgb(0_0_0/0.2)] dark:[box-shadow:var(--shx,0px)_var(--shy,12px)_36px_-6px_rgb(0_0_0/0.95)]"
    >
      {children}
      <span aria-hidden="true" style={{ background: SPOT }} className="pointer-events-none absolute inset-0 hidden rounded-2xl [--a:0.09] dark:block" />
      <span aria-hidden="true" style={RIM} className="pointer-events-none absolute inset-0 hidden rounded-2xl [--a:0.55] dark:block" />
    </div>
  );
}
