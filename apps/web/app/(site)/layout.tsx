import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
      <SiteFooter />
      {/* 型錄卡片展開的面板（攔截路由 @modal/(.)blocks/[slug]） */}
      {modal}
    </>
  );
}
