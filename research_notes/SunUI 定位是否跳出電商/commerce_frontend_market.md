# Addressable market for React + Tailwind commerce and campaign components (as of 2026-11-13)

Reading notes: every figure carries its date. "Vendor" means the source sells something related to the claim. Store Leads, BuiltWith, HTTP Archive and W3Techs are crawl-based detections, so they undercount stores behind logins or apps and cannot confirm revenue. All percentages marked "computed" are my own arithmetic from cited figures.

## 1. E-commerce platform market share (global, Taiwan, Japan, SEA, China) and what portion of merchants can use custom React code

### Takeaway
The store population is dominated by hosted or PHP theme systems (WooCommerce, Shopify Liquid, Wix, Squarespace, and in Asia Shopline, 91APP, Cyberbiz, BASE, STORES, makeshop, EC-CUBE) plus marketplaces, none of which accept a shadcn-style React install. Crawl data puts stores with a Next.js frontend at about 117k worldwide (Nov 2026), under 1 percent of detected stores, and roughly half of those are hosted SaaS platforms that merely happen to render with Next.js.

### Cited Findings
- Store Leads (Aug 2026, store count basis): WooCommerce about 29.7% of its dataset, Shopify 22.2%, Wix 7.1%, Squarespace 2.9%. Reported via a secondary summary: [GravityKit](https://www.gravitykit.com/ecommerce-platform-market-share-2026/)
- HTTP Archive (May 2026, share of all measurable web origins): WooCommerce 6.64%, Shopify 4.76%, Wix eCommerce 1.48%, Squarespace Commerce 1.12%; Shopify grew fastest at +11.7% YoY. Secondary summary: [Visionary Marketing](https://visionary-marketing.co.uk/blog/ecommerce-platform-market-share-2026)
- Other sources put Shopify first (42.6% of a sample of 84,000 stores; 45.99% in another), which shows that ranking depends on sample and method. Vendor and agency blogs: [Charle](https://www.charle.co.uk/articles/shopify-vs-other-ecommerce-platforms/), [Red Stag](https://redstagfulfillment.com/shopify-market-share/)
- Store Leads, updated 2026-11-06: 3,245,947 live Shopify stores, +4.4% QoQ and +15% YoY (2026 Q3), 83,160 Shopify Plus domains. Top countries: US 1,269,853; UK 244,832; Canada 149,947; Australia 142,651; India 130,450. No Asian market besides India is in the top 10: [Store Leads Shopify report](https://storeleads.app/reports/shopify)
- Store Leads, updated 2026-11-06: top Shopify themes are all Shopify's own Liquid themes: Trademark 467,692; Dawn 276,821; Savor 218,190; Tinker 198,018; Horizon 170,878; Rise 126,809; Debut 112,897: [Store Leads Shopify report](https://storeleads.app/reports/shopify)
- Store Leads, updated 2026-11-06: 116,755 ecommerce stores run Next.js, +0.5% QoQ, +45.7% YoY. By platform: Shopify 25,852 (22.1%), Custom Cart 22,779 (19.5%), ikas 18,720 (16.0%), Easy Order 14,202 (12.2%), order smart 10,899, Magento 8,079, OMG 7,946, Sitecore Commerce 1,200, WooCommerce 640, VTEX 416, meepShop 158. By country: Unknown 32,447; US 21,947; Turkey 18,524; Germany 6,269; UK 5,674; India 3,245; France 3,081; Iran 2,625; Hong Kong 2,093; Canada 1,701. Japan, Taiwan, China and SEA countries are not in the top 9: [Store Leads Next.js report](https://storeleads.app/reports/technology/Next.js)
- Store Leads (Mar 2026): 16,376 US ecommerce stores ran Next.js, about 52% of them on Shopify: [Store Leads Next.js US](https://storeleads.app/reports/technology/Next.js/country/US)
- Taiwan: no audited market share exists. SHOPLINE itself has said share is hard to measure and cited about 50,000 Taiwan stores (older article, date unclear): [INSIDE](https://www.inside.com.tw/article/9112-shopline-in-taiwan). An older review cites 10,000+ stores on 91APP: [Pro360](https://www.pro360.com.tw/guide/shop_platform_vs)
- SHOPLINE claims over 600,000 merchants worldwide (milestone passed in 2024, 500,000 in 2022). Company claim, not audited: [SHOPLINE about](https://shopline.com/about)
- Store Leads lists meepShop (a Taiwan hosted builder) with 158 stores detected as Next.js, which is a hosted platform rendering in Next.js, not merchant-owned code: [Store Leads Next.js report](https://storeleads.app/reports/technology/Next.js)
- Japan: BASE passed 2.5 million cumulative shop openings on 2025-11-26 (cumulative openings, not active stores; company claim): [PaymentNavi](https://paymentnavi.com/?p=168072)
- Japan survey (May 2025, n=1,769 people involved in adopting an EC build service): makeshop 13.70%, EC-CUBE 13.10%, futureshop 10.60%, ecbeing 8.40%, Color Me Shop 8.30%; the five total 54.10%. BASE, STORES and Shopify are outside the top five in this sample, which skews to mid-size businesses: [BOXIL](https://boxil.jp/mag/a9947/)
- A 2026 Japanese comparison names Shopify, BASE, STORES, Color Me Shop and MakeShop as the five most used services, without counts: [Stockcrew](https://stockcrew.co.jp/insights/article_general_ec_cart_compare_2026-04-21)
- Southeast Asia (Momentum Works, covering 2025): platform GMV US$157.6B, +22.8% YoY; Shopee, Lazada and TikTok Shop (incl. Tokopedia) hold 98.8% of platform GMV; Shopee 53%; content commerce US$49.7B or 32% of platform GMV, up from 20% in 2024: [Momentum Works](https://thelowdown.momentum.asia/new-report-southeast-asias-platform-ecommerce-reaches-us157-6b-in-2025-with-top-platforms-expanding-share-to-98-8/), [DealStreetAsia](https://www.dealstreetasia.com/stories/momentum-works-report-2025-479044)
- Vietnam 2025 (Metric.vn): Shopee about 58%, TikTok Shop about 39%, Lazada and Tiki about 3% combined: [index.vn](https://index.vn/en/news/competition-between-tiktok-shop-and-shopee-intensifies)

### Inferences
- Computed: if Shopify's 3.25M stores are 22.2% of the Store Leads universe, that universe is roughly 14 to 15 million stores, so 116,755 Next.js stores are about 0.8% of detected stores. The two figures are three months apart, so treat this as order of magnitude only.
- Computed: Next.js stores where a developer plausibly controls the code (Shopify headless 25,852 + Custom Cart 22,779 + Magento 8,079 + small enterprise platforms) come to roughly 55k to 60k. ikas, Easy Order, order smart, OMG and meepShop (about 52k combined) are hosted builders whose merchants cannot run `npx shadcn add`.
- Computed: 25,852 Next.js stores on Shopify is about 0.8% of 3.25M Shopify stores; over 99% of Shopify merchants are on Liquid themes.
- In Taiwan, Japan and SEA the merchant base sits on local hosted platforms and marketplaces. The React-installable segment there is custom builds by agencies and in-house teams (brand sites, enterprise EC on custom carts), which no source counts.
- The +45.7% YoY growth in Next.js stores is real growth from a small base, but part of it comes from hosted platforms adopting Next.js internally (ikas in Turkey explains Turkey ranking third).

### Gaps
- No reliable 2026 market share or merchant counts for Taiwan platforms (Shopline TW, 91APP, Cyberbiz, Shopify TW). Store Leads country pages returned 404 at the URLs tried; 91APP's annual report was not checked.
- No Shopify Japan store count, STORES count or active-store figure for BASE found.
- No China figures found in this pass. China commerce is overwhelmingly marketplace and mini-program based (Tmall, JD, Pinduoduo, Douyin, WeChat), but I did not retrieve a source for a share figure, so this stays unsourced.
- No source gives the share of SEA or Taiwan ecommerce that flows through brand-owned sites versus marketplaces.

## 2. Headless commerce adoption: size, growth, and the 2025 to 2026 direction

### Takeaway
Headless is growing in absolute count but remains a low-single-thousands to tens-of-thousands niche, and 2025 to 2026 discourse plus Shopify's own roadmap moved toward "Liquid by default, headless only for teams with frontend engineers". The widely quoted "73% of businesses are headless" and market-size forecasts are vendor-sponsored and should not be used for sizing.

### Cited Findings
- Store Leads, updated 2026-11-06: 5,353 stores use Shopify Hydrogen, +2.4% QoQ, +120.7% YoY; 97.9% on Shopify; US 1,706, UK 295, Australia 180, unknown country 1,073: [Store Leads Hydrogen report](https://storeleads.app/reports/technology/Shopify%20Hydrogen)
- BuiltWith (undated page, retrieved Nov 2026): 2,313 live sites using Shopify Hydrogen and Oxygen, 1,142 in the US. Conflicts with Store Leads by a factor of about 2: [BuiltWith](https://trends.builtwith.com/shop/Shopify-Hydrogen-and-Oxygen)
- Technologychecker (crawl as of 2026-10-19): 18,392 sites across 15 "ecommerce frontend" technologies; Hyva Themes 6,689 (36.37%), GemCommerce 5,737 (31.19%), Shogun Frontend 2,714 (14.76%), MonkCommerce 1,761, PWA Studio 568, Vue Storefront 2.3%. Hyva is a Magento theme and GemCommerce and MonkCommerce are Shopify app scripts, so the category is loosely defined: [Technologychecker](https://technologychecker.io/category/ecommerce-frontends)
- Market size forecasts for headless commerce platforms in 2026 range from about US$1.74B to US$2.41B; Research and Markets projects US$6.17B by 2031. Paid analyst reports relayed by vendor blogs: [Research and Markets](https://www.researchandmarkets.com/reports/6261065/headless-commerce-platform-market-share), [Swell (vendor)](https://www.swell.is/content/headless-commerce-statistics)
- The "73% of businesses run headless" figure circulates in vendor posts (attributed to Alokai, dated 2024 in one) and could not be traced to a primary study; a "312% jump in Q1 2026" claim comes from one news item citing an unverifiable institute. Treat both as unreliable: [Crystallize (vendor)](https://crystallize.com/blog/headless-commerce-statistics), [pulse.bot](https://www.pulse.bot/retail/news/headless-commerce-adoption-jumps-312-as-retailers-ditch-monoliths-bdf56d07-665f-410d-a39c-dccd1353e9f5/)
- Shopify's 2026 developer announcements "doubled down on Liquid": more page structure in Liquid, reusable components, partial server rendering. Agency commentary: [Domaine](https://domaineworldwide.com/insights/commerce-insights/shopify-dotdev-2026-announcements/)
- Agency view (2026): Liquid fits "95%+" of Shopify stores; headless only for brands with dedicated frontend teams and multi-storefront needs; the checkout-customization case for headless "is now largely dead" after the old Checkout API was switched off in 2025. Agency blogs with a stake: [WitsCode](https://witscode.com/blogs/stay-on-shopify-liquid), [WitsCode headless 2026](https://witscode.com/blogs/headless-shopify-2026)
- A Hydrogen agency (Commerce-UI, Spring 2026) concedes roughly 60% of Liquid sites pass all Core Web Vitals (citing performance.shopify.com), which removes the old performance argument; it claims the build cost gap is "around 20%" on its own projects. Vendor: [Commerce-UI](https://commerce-ui.com/insights/the-state-of-shopify-headless-vs-liquid-spring-2026)
- Horizon launched in Shopify Editions Summer '25 as the new theme foundation with AI block generation and Sidekick inside the theme editor: [Codrops](https://tympanus.net/codrops/?p=94781), [Ask Phill](https://askphill.com/blogs/blog/shopify-editions-summer-25-horizon)
- Horizon is already on 170,878 stores and its sibling themes Savor (218,190), Tinker (198,018) and Rise (126,809) are in the top 10 as of 2026-11-06: [Store Leads Shopify report](https://storeleads.app/reports/shopify)
- Hydrogen npm package is at v2026.4.0 (2026-04-09), and the June 2026 Edition reportedly moves Hydrogen toward a framework-agnostic core. Secondary sources, one of which calls the new line a developer preview: [Digital Applied](https://www.digitalapplied.com/blog/shopify-spring-2026-edition-developer-hydrogen-static-apps), [Fudge](https://www.fudge.ai/blog/headless-shopify-hydrogen/)
- Named Hydrogen brands: SKIMS, Gymshark, Good American, Denim Tears, Allbirds (35 countries). Secondary: [Charle](https://www.charleagency.com/articles/shopify-hydrogen-oxygen/)

### Inferences
- Computed: Hydrogen at 5,353 stores is 0.16% of live Shopify stores, and it is about 30 times smaller than the Horizon theme alone, which launched three years later. Shopify's merchant growth is going to AI-assisted Liquid themes, not headless.
- Direction in 2025 to 2026: headless is not retreating in count (Hydrogen +120.7% YoY, Next.js stores +45.7% YoY) but growth flattened in the latest quarter (+2.4% and +0.5% QoQ), and the narrative shifted against it for small and mid merchants. The honest label is "growing niche for upmarket brands, stalled as a mainstream path".
- AI block generation inside Horizon is a direct substitute for buying animated sections: a merchant on Liquid can ask Sidekick for a block instead of hiring someone to install React components.
- A framework-agnostic Hydrogen would slightly widen the set of React and Next.js Shopify storefronts, but the base is thousands, not hundreds of thousands.

### Gaps
- No official Shopify figure for Hydrogen or Oxygen storefront counts was found; Shopify investor materials were not retrieved in this pass.
- No independent survey of the share of stores that are headless. The MACH Alliance survey (561 IT decision makers, enterprise only) was seen only through a vendor blog and not verified.
- No usage counts found for commercetools, BigCommerce Catalyst deployments, Saleor Cloud or Vendure installs.

## 3. How many developers work on React commerce frontends

### Takeaway
Open-source signals show a real but modest developer community: commerce-specific repos have tens of thousands of stars and low hundreds of thousands of weekly npm downloads, against 91 million weekly downloads for Next.js and 128k stars for shadcn/ui. Commerce is a small slice of the React frontend world, well under 1 percent by download volume.

### Cited Findings
- GitHub stars on 2026-11-12: shadcn-ui/ui 128,002; medusajs/medusa 37,207; saleor/saleor 23,557; vercel/commerce (Next.js Commerce) 14,310 with 5,449 forks; Shopify/hydrogen 2,176; bigcommerce/catalyst 249 with 362 forks: [GitHub API](https://api.github.com/search/repositories?q=repo:medusajs/medusa+repo:saleor/saleor+repo:vendure-ecommerce/vendure+repo:vercel/commerce+repo:Shopify/hydrogen+repo:bigcommerce/catalyst+repo:shadcn-ui/ui)
- npm weekly downloads, 2026-11-05 to 2026-11-11: `next` 91,355,769: [npm API](https://api.npmjs.org/downloads/point/last-week/next); `@shopify/hydrogen` 133,065: [npm API](https://api.npmjs.org/downloads/point/last-week/@shopify/hydrogen); `@medusajs/medusa` 343,607: [npm API](https://api.npmjs.org/downloads/point/last-week/@medusajs/medusa)
- Live storefront counts as a proxy for teams: 5,353 Hydrogen stores and 25,852 Next.js stores on Shopify (2026-11-06): [Store Leads Hydrogen](https://storeleads.app/reports/technology/Shopify%20Hydrogen), [Store Leads Next.js](https://storeleads.app/reports/technology/Next.js)

### Inferences
- Computed: Hydrogen weekly downloads are about 0.15% of Next.js weekly downloads and Medusa about 0.38%. npm downloads are inflated by CI, so the ratio matters more than the absolute numbers.
- Computed: the 5,449 forks of vercel/commerce suggest a few thousand teams started from the Next.js Commerce template over its lifetime, consistent with the low tens of thousands of Next.js Shopify stores.
- If each custom React storefront (about 55k to 60k, see section 1) has one to three frontend developers or one agency behind it, the reachable developer population is on the order of 50k to 150k worldwide, concentrated in the US, UK, Germany and India. This is my estimate, not a sourced figure.
- shadcn/ui's 128k stars against Hydrogen's 2.2k shows where the distribution channel is: general React developers, not commerce specialists.

### Gaps
- No direct headcount of React commerce developers exists in any source found.
- Vendure repo stats were not returned by the GitHub query (the repo may have moved); Saleor and Vendure install numbers not found.
- No template usage numbers from Vercel for Next.js Commerce deployments.

## 4. Who builds seasonal campaign and promo landing pages, and with what tools

### Takeaway
On hosted platforms, campaign pages are built by merchants, marketers and agencies inside the platform's theme editor or a page-builder app (PageFly, GemPages, Shogun, Replo, Instant), increasingly with AI block generation. Custom-coded React campaign pages are an agency and in-house-team product for larger brands; no source quantifies that share.

### Cited Findings
- PageFly is described as the most established Shopify page builder with "over 70,000 active installs" (undated agency or vendor guide, unverified): [Fudge](https://www.fudge.ai/blog/pagefly-alternatives/)
- Shopify App Store review counts (Oct 2026 snapshot in a competitor roundup): PageFly 5,918 reviews, GemPages 878, Shogun 425, Replo 186; the top ten page builders range from 106 to 5,918 reviews: [CraftShift](https://craftshift.com/best-shopify-page-builder-apps-2026/)
- There are 70+ page builder apps in the Shopify App Store as of 2026 (vendor source): [Section Store](https://section.store/blogs/store-design-optimisation/best-shopify-page-builders-compared-pros-amp-cons-2026)
- GemCommerce (GemPages' script) is detected on 5,737 sites and Shogun Frontend on 2,714 in one crawl (2026-10-19); this crawl clearly undercounts versus install claims: [Technologychecker](https://technologychecker.io/category/ecommerce-frontends)
- Horizon themes let merchants generate new content blocks or restyle existing ones with AI in the theme editor (Summer '25 onward): [Inside Retail](https://insideretail.com.au/digital/shopifys-ai-revolution-build-stores-faster-and-smarter-202505)
- SEA campaign activity is concentrated inside marketplaces and content commerce: 32% of platform GMV in 2025 came from content commerce: [Momentum Works](https://thelowdown.momentum.asia/new-report-southeast-asias-platform-ecommerce-reaches-us157-6b-in-2025-with-top-platforms-expanding-share-to-98-8/)

### Inferences
- A single Shopify page-builder app (PageFly, about 70k installs claimed) has more merchant installs than all Hydrogen stores plus all Next.js Shopify stores combined (about 31k). The campaign-page budget on hosted platforms flows to no-code builders, not component libraries.
- In Taiwan and SEA, the 11.11, 12.12 and 618 style campaign pages for most merchants are marketplace shop decorations or Shopline, 91APP and Cyberbiz editor pages. The React-buildable campaign work is brand microsites, corporate event sites and enterprise custom EC, typically done by digital agencies.
- So the buyer for React campaign blocks is the agency or in-house developer who is handed a campaign brief with a deadline, not the merchant. That matches the "agencies + seasonal packs" angle already in the project memory.

### Gaps
- No data on how many agencies build custom-coded campaign pages, their volume per year, or price points.
- No figures for Shopline, 91APP or Cyberbiz page editor or app-store usage.
- Verified install counts for GemPages, Shogun, Replo, Instant not found (only review counts).

## 5. Non-store uses of commerce-like UI (SaaS pricing and checkout, creator stores, ticketing, restaurant ordering, bookings, DTC brand sites, crowdfunding)

### Takeaway
I found no source that sizes these adjacent segments for a React component library. The only hard signal is indirect: several of the largest "Next.js ecommerce" clusters in crawl data are restaurant-ordering, direct-selling and cannabis-menu platforms, which confirms commerce-like UI on Next.js extends beyond classic stores, but mostly inside hosted SaaS.

### Cited Findings
- Among Next.js ecommerce stores (2026-11-06), non-classic-retail hosted platforms are prominent: order smart 10,899 (restaurant ordering), Herbalife 1,082 (direct-selling distributor sites), weedmaps 380 (dispensary menus), Zyda 292 and Zammit 602 (MENA ordering and store builders): [Store Leads Next.js report](https://storeleads.app/reports/technology/Next.js)
- AI app builders that default to React + Tailwind + shadcn list e-commerce storefronts as only one of many build types (websites, internal tools, CRMs, inventory, HR), with no percentage split. Vendor report (Lovable, data Jan 2025 to May 2026): [Lovable](https://lovable.dev/blog/a-first-look-at-the-build-economy)

### Inferences
- Pricing tables, checkout summaries, product cards, countdowns, coupon and ticket UI are needed by SaaS marketing sites, event pages and creator stores, all of which are far more often built in Next.js than storefronts are (see section 6). The adjacent pool of projects is plausibly an order of magnitude larger than the custom React storefront pool, but this is reasoning from the section 6 totals, not a measured figure.
- The platforms serving creators, ticketing, bookings and restaurant ordering (Gumroad, Lemon Squeezy, Stripe Checkout, Eventbrite, KKTIX, Square, Toast and similar) are hosted, like Shopify. The React-installable part is again the custom-built minority plus the marketing site around a hosted checkout.

### Gaps
- No counts found for SaaS pricing or checkout pages built in React, creator stores, ticketing, bookings or crowdfunding pages on custom React. Searches were not run for each vertical individually because of the call budget; this question is largely unanswered.
- No data on Stripe Checkout or Lemon Squeezy embeds on Next.js sites.

## 6. Size of the React and Next.js web market outside commerce, for comparison

### Takeaway
The general Next.js world is one to two orders of magnitude larger than Next.js commerce: about 2.5 million sites or 730k companies versus about 117k stores, and 91 million weekly npm downloads versus 133k for Hydrogen. AI app builders (v0, Lovable) add millions of users generating React + shadcn projects, most of them not stores.

### Cited Findings
- W3Techs (2026-02-13): Next.js is on about 2.8% of websites with an identifiable JavaScript library, 6.8% of the top million, 12.4% of the top 100,000: [W3Techs](https://w3techs.com/technologies/breakdown/js-nextjs/ranking)
- Wappalyzer-based estimate (2026): about 2.5 million websites on Next.js, about 12% of tracked JS framework market. Secondary agency roundup: [eSparkInfo](https://www.esparkinfo.com/software-development/front-end/statistics)
- Technologychecker (Aug 2026): 731,970 companies detected using Next.js, many on subdomains such as careers or docs: [Technologychecker](https://technologychecker.io/technology/next-js)
- `next` had 91,355,769 npm downloads in the week of 2026-11-05 to 2026-11-11: [npm API](https://api.npmjs.org/downloads/point/last-week/next)
- shadcn-ui/ui had 128,002 GitHub stars on 2026-11-12: [GitHub API](https://api.github.com/search/repositories?q=repo:medusajs/medusa+repo:saleor/saleor+repo:vendure-ecommerce/vendure+repo:vercel/commerce+repo:Shopify/hydrogen+repo:bigcommerce/catalyst+repo:shadcn-ui/ui)
- v0 user counts conflict: "more than 3.5 million unique users" (Vercel, Sep 2025), "4 million" (SaaStr), "6M+" by early 2026 (third party). Vendor-reported: [SaaStr](https://www.saastr.com/saastr-ai-app-of-the-week-v0-by-vercel-the-vibe-coding-tool-that-4-million-people-use-to-ship-real-software-not-just-demos), [Luminix](https://www.useluminix.com/reports/industry-analysis/vibe-coding-tool-landscape-replit-v0-base44-bolt-lovable-vercel)
- Lovable: 8 million users and over 60 million projects created (vendor-reported, 2026); third-party telemetry suggests heavy drop-off after early builds: [The Next Web](https://thenextweb.com/news/lovable-build-economy-500m-arr-vibe-coding), [GetPanto](https://www.getpanto.ai/blog/lovable-statistics)

### Inferences
- Computed: 116,755 Next.js stores are about 4.7% of the roughly 2.5 million Next.js sites, and the developer-controlled subset (about 55k to 60k) is about 2.3%. So roughly 95 to 98% of Next.js sites are something other than a store a developer can modify. The two numerators and denominators come from different crawlers, so this is indicative only.
- The higher Next.js share among top-ranked sites (12.4% of the top 100k) says Next.js skews to funded companies with engineering teams: SaaS, AI products, media and marketing sites, which is where paid component libraries historically sell.
- The MCP and agent-facing distribution SunUI already has (shadcn registry, MCP server, llms.txt) points at the v0, Lovable and Claude Code population, which is general-purpose. A positioning limited to "storefronts" addresses a few percent of that population; "campaign, launch and pricing pages for any product" addresses most of it.

### Gaps
- No source breaks down what Next.js sites are used for (SaaS marketing versus dashboards versus AI apps versus commerce) by percentage. Vercel and Netlify reports were not found with such a split.
- No shadcn registry install telemetry or share of v0 or Lovable projects by category.
- No regional (Taiwan, Japan, SEA) count of Next.js sites or developers was retrieved.
