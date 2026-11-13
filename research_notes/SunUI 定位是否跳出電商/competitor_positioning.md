# Competitor positioning: general purpose vs vertical in the React / Tailwind / shadcn UI library market (as of 2026-11-13)

Method notes for the writer:
- GitHub star counts and npm weekly downloads were pulled live from the GitHub REST API and the npm downloads API on 2026-11-13. They are cited to the repo or package page. npm week is 2026-11-05 to 2026-11-11.
- Vendor counts (blocks, customers) are self-reported marketing numbers unless stated otherwise.
- Web search summaries were used for several items. Where I did not open the primary page myself, the line says "search snippet".
- Not covered or only thinly covered because of the tool budget: Skiper UI, Kokonut UI Pro, Animate UI pricing, Shadcn Studio counts, Flowbite block counts, Tailwind Plus live category counts. See Gaps.

## 1. Per-library positioning, target user, catalog scope, pricing, traction

### Takeaway
Almost every library in the set positions itself horizontally: "components / blocks for landing pages and apps", aimed at "design engineers", indie hackers, founders and agencies, with SaaS and AI startup marketing pages as the default page type. Paid tiers converge on a one-time lifetime license between about USD 89 and USD 349 for individuals, and the only hard public revenue numbers are Aceternity (about USD 60K to 100K per month in Oct 2024, roughly half from services) and Tailwind Labs (revenue down about 80 percent, Jan 2026).

### Cited Findings

Summary table (details and sources in the bullets below):

| Library | Stated positioning | Scope | Paid model | Traction (date) |
|---|---|---|---|---|
| shadcn/ui | "Composable, accessible components... Build your own component library" | Primitives + official blocks (sidebar, login, signup, dashboard) | Free, MIT | 128,002 stars; `shadcn` CLI 17.8M npm downloads/week (2026-11-13) |
| Tailwind Plus | "By the makers of Tailwind CSS" | Marketing, Application UI, Ecommerce + templates | One-time USD 299 personal, USD 979 team | Revenue down ~80%, 3 of 4 engineers laid off (Jan 2026) |
| Magic UI / Pro | "UI library for Design Engineers" | 150+ animated components; Pro = 50+ landing sections, 9+ templates | Pro USD 199 lifetime | 23,230 stars (2026-11-13) |
| Aceternity UI / Pro | "Beautiful UI components for modern web applications" | 200+ free components, 100+ premium blocks, 30+ templates | USD 199 lifetime | "50,000+ developers"; ~USD 80K/month (Oct 2024) |
| React Bits / Pro | "Largest open-source library of animated, interactive... components" | 230 animated components; Pro adds 300 page blocks, 300 app blocks, 15 templates | USD 129 / 249 / 349 one-time | 51,804 stars (2026-11-13) |
| 21st.dev | "npm for design engineers" marketplace | Community registry of everything + Magic MCP | Freemium / usage (not verified) | YC W2026; "1M+ total users" claim |
| Cult UI / Pro | "Animated components for design engineers" | 150+ free components; Pro blocks/templates | Pro lifetime about USD 179 (third party) | 7,110 stars |
| Origin UI / coss ui | "Official design system of Cal.com" | App UI primitives and particles | Free | 10,837 stars; acquired by Cal.com 2025 |
| shadcnblocks.com | "The Ultimate React UI Library" | 2,866 blocks, 2,241 components, 97 pages, 22 templates, admin kit | Lifetime USD 149 / 299 / 399 list | 5,420 Pro customers, 22,162 free users (self-reported, Nov 2026) |
| Shadcn Studio | Copy-paste shadcn components, blocks, templates + theme generator | Marketing, dashboard/app, eCommerce groups | Free + Pro (price not verified) | 1,988 stars |
| Tremor | "React components to build charts and dashboards" | Dashboards / charts only | Free (acquired by Vercel Jan 2025) | 16,461 stars (npm repo), 521K npm downloads/week |
| HeroUI | "Beautiful, fast and modern React UI library" | General app components; Pro = 220+ components | Pro one-time, USD 249 / 399 / 799 (third party) | 31,194 stars; 1.22M npm downloads/week |
| Untitled UI React | "World's largest collection of open-source React components" | Design system: app + marketing, 250+ page examples in PRO | PRO lifetime; site shows Business USD 2,499 and Enterprise USD 8,999 | 2,004 stars |
| Motion Primitives | "UI kit to make beautiful, animated interfaces, faster" | Motion primitives | Free core | 6,942 stars; last push 2026-09-28 |
| Animate UI | "Fully animated, open-source component distribution" | Animated shadcn-style components | Free | 4,980 stars |
| Kokonut UI | "Stunning components built with Tailwind, shadcn/ui and Motion" | Components for websites | Pro not verified | 2,306 stars |
| Skiper UI | Not verified | Not verified | One-time (third party) | Not verified |

shadcn/ui
- Repo description: "Composable, accessible components with thoughtful defaults. Build your own component library"; 128,002 stars, last push 2026-11-12. Source: [github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui)
- The `shadcn` CLI package had 17,823,132 npm downloads in the week 2026-11-05 to 2026-11-11. Source: [npmjs.com/package/shadcn](https://www.npmjs.com/package/shadcn)
- Official blocks page tagline: "Clean, modern building blocks. Copy and paste into your apps. Works with all React frameworks. Open Source. Free forever." Categories shown are Featured, Sidebar, Login, Signup (dashboard appears as an example). There is no ecommerce or marketing category. Source: [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)
- The community list awesome-shadcn-ui has 20,810 stars, a proxy for the size of the third-party ecosystem. Source: [github.com/birobirobiro/awesome-shadcn-ui](https://github.com/birobirobiro/awesome-shadcn-ui)

Tailwind Plus (formerly Tailwind UI)
- Pricing: USD 299 one-time personal license (official checkout page via search snippet); team license USD 979 for up to 25 people (third-party snippet). Source: [tailwindcss.com/plus](https://tailwindcss.com/plus), [tailkits.com](https://tailkits.com/blog/tailwind-plus-replaced-tailwind-ui/)
- Catalog is three kits: Marketing, Application UI, Ecommerce, plus templates. Search snippet of the UI Blocks page shows Ecommerce sub-categories such as Product Overviews (5 components) and Shopping Carts (6 components). Source: [tailwindcss.com/plus/ui-blocks](https://tailwindcss.com/plus/ui-blocks)
- Tailwind CSS itself: 98,588 stars. Source: [github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
- Jan 6 to 7, 2026: Tailwind Labs laid off 3 of 4 engineers; Adam Wathan said usage is "growing faster than it ever has" while revenue is down almost 80 percent. Reporting ties it to AI assistants answering questions so developers never visit the docs where the paid product is promoted. Source: [DevClass, 2026-01-08](https://www.devclass.com/ai-ml/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/4079571), [The New Stack](https://thenewstack.io/tailwind-creator-says-ai-played-a-role-in-downsizing/)
- After the disclosure, Google AI Studio (announced Jan 9, 2026), Vercel, Supabase and others became sponsors. Source: [ppc.land](https://ppc.land/tech-giants-rush-to-sponsor-tailwind-css-after-devastating-layoffs/)
- Historical: over USD 2M annual revenue from Tailwind UI by 2020 (secondary source, search snippet). Source: [leanware.co](https://leanware.co/insights/tailwind-ai-crisis)
- UNVERIFIED and conflicting: one third-party page claims Tailwind Plus stopped taking new customers in September 2026. When I fetched tailwindcss.com/plus and /plus/ui-blocks on 2026-11-13, both returned only a login page, which is consistent with that claim but does not prove it (it could also be a fetch or bot gate). Source: [toolsurf.com](https://www.toolsurf.com/tailwind-group-2026/); official pages [tailwindcss.com/plus](https://tailwindcss.com/plus)

Magic UI and Magic UI Pro
- Tagline "UI library for Design Engineers", "Perfect companion for shadcn/ui"; 150+ free animated components and effects; showcase headed "Companies choose Magic UI to build their landing pages" (examples are YC startups such as Infisical, Langfuse, Million). Source: [magicui.design](https://magicui.design)
- 23,230 stars, last push 2026-11-12. Source: [github.com/magicuidesign/magicui](https://github.com/magicuidesign/magicui)
- Pro: "9+ templates and 50+ landing page sections built with Next.js, Typescript, Tailwind CSS, Shadcn, and Motion". USD 199 one-time individual lifetime license. Templates: Codeforge, AI Agent, Dev Tool, Mobile, SaaS, Startup, Portfolio, Changelog, Blog. Section categories: Header, Hero, Social Proof, Feature Scroll, Feature Slideshow, Feature Cards, Pricing, CTA, FAQ, Footer. No commerce template or section. Source: [pro.magicui.design](https://pro.magicui.design/)
- No public revenue number found for Magic UI. The "USD 300K MRR in 45 days" figure attached to founder Dillion Verma is for a different consumer AI app, not Magic UI. Source: [Superwall Podcast](https://www.buzzsprout.com/2522779/episodes/18958462-dillion-verma-0-to-300k-mo-in-45-days-with-my-ai-app-just-copy-me)

Aceternity UI and Pro
- Tagline "Beautiful UI components for modern web applications"; "Animated components, blocks, full pages, interactions and templates for React, Next.js, Tailwind CSS and Motion"; 200+ free components, 100+ premium blocks, 30+ templates (page is internally inconsistent: other spots say 100+ components and 200+ blocks); "trusted by 50,000+ developers"; lifetime access USD 199; founded 2023 by Manu Arora. Template names point at agency, SaaS, portfolio and AI agent sites. Source: [ui.aceternity.com/brand-facts](https://ui.aceternity.com/brand-facts)
- Revenue (Oct 8, 2024 interview, self-reported): header figure USD 80K per month; average USD 60K to 100K per month; prior month about USD 40K from Pro and about USD 30K from website-building services; expenses about USD 5K per month; Pro crossed USD 80K total about two months after launch. Founder describes it as "building blocks that helps developers build landing pages", customers are web developers and founders, mainly early-stage, many YC-backed. Growth channels: Product Hunt, X, a Fireship video. Source: [Starter Story](https://www.starterstory.com/stories/aceternity-ui)

React Bits and React Bits Pro
- Repo description: "The largest open-source library of animated, interactive, and customizable React & Next.js components"; 51,804 stars, last push 2026-11-10. Source: [github.com/DavidHDev/react-bits](https://github.com/DavidHDev/react-bits)
- Pro launched Feb 11, 2026 (Product Hunt, search snippet). Source: [Product Hunt](https://www.producthunt.com/products/react-bits-pro/launches)
- Pro tagline "The premium React UI library you'll actually ship with", "Pay once, ship stunning pages forever". Targets indie hackers shipping SaaS, AI and content products, startup founders, agencies and freelancers, and developers using AI coding agents. Starter USD 129 (230 animated components), Pro USD 249 (adds 300 page blocks in 22 categories, 300 app UI blocks in 38 categories incl. dashboards and "AI agent surfaces", and an Agent Kit of 20 design skills, prompts, recipes), Ultimate USD 349 (adds 15 Next.js templates: SaaS, AI SaaS, AI app, agency, shader, security, 8-bit). Source: [pro.reactbits.dev/about](https://pro.reactbits.dev/about)
- Note: a search snippet of the same site quoted USD 99 / 199 / 299, so the price appears to have risen or is discounted at times. Source: [pro.reactbits.dev](https://pro.reactbits.dev/compare/react-bits-pro-vs-free-react-bits)

21st.dev
- Repo description: "npm for design engineers: largest marketplace of shadcn/ui-based React Tailwind components, blocks and hooks"; 5,562 stars; the public repo was last pushed 2025-05-28. Source: [github.com/serafimcloud/21st](https://github.com/serafimcloud/21st)
- Y Combinator Winter 2026 batch; founders Serafim Korablev (CEO) and Sergey Bunas. Source: [ycombinator.com/companies/21st](https://www.ycombinator.com/companies/21st)
- Company's own story page claims 9 products launched, over 1 million total users, 10K GitHub stars. A secondary article claims 1.4M developers. A third-party aggregator lists USD 500K seed. All unverified. Source: [21st.dev/our-story](https://21st.dev/our-story), [startuphub.ai](https://www.startuphub.ai/news/claudes-corner-21st-dev-yc-w2026)
- It has shifted toward agent infrastructure (Magic MCP, components generated or fetched by coding agents). Source: [startuphub.ai](https://www.startuphub.ai/news/claudes-corner-21st-dev-yc-w2026)

Cult UI
- "Animated components for design engineers. 150+ free shadcn/ui components, built with Tailwind CSS and Motion"; 7,110 stars, last push 2026-10-29. Source: [github.com/nolly-studio/cult-ui](https://github.com/nolly-studio/cult-ui)
- Cult UI Pro offers a lifetime option and an annual option; third-party listings put lifetime at USD 179 (was USD 279). Source: [pro.cult-ui.com/pricing](https://www.pro.cult-ui.com/pricing)

Origin UI / coss ui
- origin-space/originui now redirects to cosscom/ui: "coss.com/ui is the official design system of Cal.com"; 10,837 stars, last push 2026-11-09. Source: [github.com/cosscom/ui](https://github.com/cosscom/ui)
- coss ui docs: it is "the evolution of Origin UI", created by Pasquale Vitiello and Davide Pacilio, acquired by Cal.com; built on Base UI in layers (primitives, particles, atoms). Launched on Product Hunt Oct 15, 2025. Origin UI remains available with limited maintenance. Source: [coss.com/ui/docs/roadmap](https://coss.com/ui/docs/roadmap), [Product Hunt](https://www.producthunt.com/p/cal/coss-com-ui)

shadcnblocks.com
- Tagline "The Ultimate React UI Library". 2,697+ blocks (library listing shows 2,866), 2,241+ Pro components, 97+ pages, 22 Next.js and Astro marketing templates, 39 themes, Figma kit with 579 block designs, Admin Kit with 200+ screens; ships 100+ blocks per month. Lifetime one-time pricing: Pro USD 149, Premium USD 299, Elite USD 399 list (USD 89 / 179 / 239 under a 40 percent Black Friday code at fetch time). Self-reported: 22,162 free users, 5,420 Pro customers, about 10,000 installs per day, established 2023. Source: [shadcnblocks.com/pricing](https://www.shadcnblocks.com/pricing)
- It also now owns the Kibo UI registry (haydenbleasel/kibo redirects to shadcnblocks/kibo, 3,984 stars). Source: [github.com/shadcnblocks/kibo](https://github.com/shadcnblocks/kibo)

Shadcn Studio
- "An open-source collection of copy-and-paste shadcn components, blocks, and templates, paired with a powerful theme generator"; 1,988 stars, last push 2026-08-20. Source: [github.com/shadcnstudio/shadcn-studio](https://github.com/shadcnstudio/shadcn-studio)
- Its pricing page describes six block groups including Dashboard and Application blocks and eCommerce UI blocks (product lists, carts, checkout), with a free set across marketing, dashboard and eCommerce (search snippet). Source: [shadcnstudio.com/pages/pricing-page](https://shadcnstudio.com/pages/pricing-page)

Tremor
- "React components to build charts and dashboards"; tremor-npm 16,461 stars but last pushed 2025-01-13; newer copy-paste repo tremorlabs/tremor 3,699 stars, last pushed 2025-10-10. Source: [github.com/tremorlabs/tremor-npm](https://github.com/tremorlabs/tremor-npm), [github.com/tremorlabs/tremor](https://github.com/tremorlabs/tremor)
- Vercel acquired Tremor, announced Jan 22, 2025; cofounders joined Vercel's Design Engineering team to work on the Vercel Dashboard and v0; terms not disclosed. Source: [vercel.com/blog/vercel-acquires-tremor](https://vercel.com/blog/vercel-acquires-tremor)
- `@tremor/react` still gets 521,435 npm downloads per week. Source: [npmjs.com/package/@tremor/react](https://www.npmjs.com/package/@tremor/react)

HeroUI (formerly NextUI)
- "Beautiful, fast and modern React UI library. (Previously NextUI)"; 31,194 stars; `@heroui/react` 1,220,036 npm downloads per week. Source: [github.com/heroui-inc/heroui](https://github.com/heroui-inc/heroui), [npmjs.com/package/@heroui/react](https://www.npmjs.com/package/@heroui/react)
- HeroUI Pro: one-time payment, lifetime access to 220+ Pro (v2) components; Pro for v3 is a separate product and license. Third-party listings give Solo USD 249, Startup USD 399, Organization USD 799 (may be out of date). Source: [v2.heroui.pro/pricing](https://v2.heroui.pro/pricing), [heroui.pro/pricing](https://www.heroui.pro/pricing)

Untitled UI React
- "World's largest collection of open-source React components built with Tailwind CSS and React Aria"; 2,004 stars, last push 2026-11-12. Source: [github.com/untitleduico/react](https://github.com/untitleduico/react)
- Free MIT core; advanced components and 250+ page examples need a PRO license. Official pricing page (search snippet) lists React PRO Business at USD 2,499 (up to 20 users) and Enterprise at USD 8,999; older third-party pages cite Solo USD 349 and Team USD 699. Prices conflict across sources. Source: [untitledui.com/pricing](https://www.untitledui.com/pricing), [untitledui.com/react](https://untitledui.com/react)
- `@untitledui/icons` gets 523,359 npm downloads per week (icons, not the component kit). Source: [npmjs.com/package/@untitledui/icons](https://www.npmjs.com/package/@untitledui/icons)

Motion Primitives, Animate UI, Kokonut UI, Skiper UI
- Motion Primitives: "UI kit to make beautiful, animated interfaces, faster. Customizable. Open Source."; 6,942 stars; last push 2026-09-28. Source: [github.com/ibelick/motion-primitives](https://github.com/ibelick/motion-primitives)
- Animate UI: "Fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, Motion, and Shadcn CLI"; 4,980 stars; repo now under imskyleen/animate-ui. Source: [github.com/imskyleen/animate-ui](https://github.com/imskyleen/animate-ui)
- Kokonut UI: "Open-source collection of stunning Components built with Tailwind CSS, shadcn/ui and Motion to use on your websites"; 2,306 stars. Source: [github.com/kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui)
- Skiper UI: a third-party directory describes one-time pricing with lifetime updates on paid tiers. I did not verify anything on the vendor site. Source: [tailkits.com/components/skiper-ui](https://tailkits.com/components/skiper-ui/)

### Inferences
- Price anchor: the market has settled on a one-time individual license of roughly USD 150 to 350 (Magic UI Pro 199, Aceternity 199, React Bits Pro 129 to 349, shadcnblocks 149 to 399, Tailwind Plus 299, Cult UI Pro about 179). Untitled UI is the outlier, selling a design system to teams at four figures.
- Rough revenue sizing, estimate only: shadcnblocks' 5,420 Pro customers at USD 89 to 399 implies somewhere around USD 0.5M to 2M lifetime gross since 2023. This is my arithmetic, not a disclosed number.
- Stars are a weak proxy for revenue. React Bits has 2.2x the stars of Magic UI but only started charging in Feb 2026. Aceternity has no meaningful open repo yet reported the highest income.
- The three ownership outcomes for successful free libraries in 2025 were all absorption into a platform's design team (shadcn at Vercel is commonly reported, Tremor to Vercel in Jan 2025, Origin UI to Cal.com in 2025), not standalone growth.
- Tailwind Labs is the cautionary case for any "docs traffic leads to paid kit" funnel: usage up, revenue down about 80 percent, because agents consume the free layer without a human seeing the upsell. React Bits Pro (Agent Kit, "best for AI coding agents" page), Aceternity ("let your AI agent do it"), 21st.dev (Magic MCP) and shadcnblocks (a community Claude Code skill exists) are all repositioning toward agent-readable catalogs.

### Gaps
- No public revenue for Magic UI, React Bits Pro, shadcnblocks, Cult UI, Shadcn Studio, HeroUI Pro, Untitled UI. Only self-reported customer counts (shadcnblocks) exist.
- Aceternity revenue is two years old (Oct 2024) and self-reported; no 2026 update found. Aceternity's free repo star count was not retrieved.
- Tailwind Plus: could not load the live catalog or pricing (login wall), so current per-category counts and whether it is still on sale in Nov 2026 are unconfirmed.
- Skiper UI, Kokonut UI Pro, Animate UI paid tiers, and Shadcn Studio price and block counts were not verified on vendor pages.
- Whether shadcn (the person) was hired or "acquired" by Vercel was only seen in an AI-generated Sacra summary; no primary source fetched.

## 2. Explicitly e-commerce vertical libraries: who they are, how big, thriving or stagnating

### Takeaway
Standalone commerce-only UI libraries in the shadcn ecosystem are tiny (double- to low-triple-digit stars) and mostly stagnant, while commerce sections inside large horizontal catalogs are healthy and growing. The commerce component libraries with real usage (Polaris, Medusa UI, Hydrogen) are platform-bound and serve admin or data plumbing, not animated storefront marketing.

### Cited Findings
- Commercn: "Shadcn UI Blocks for E-commerce Websites", 8 categories (Checkouts, Carts, Reviews, Orders, Categories, Product Details, Products, Promo Banners), by Arif Hossain (RetroUI); badge says V1.0. A 2025 writeup counted 12 blocks. Repo Logging-Studio/Commercn has 81 stars, last push 2026-08-07. Source: [commercn.com](https://commercn.com), [github.com/Logging-Studio/Commercn](https://github.com/Logging-Studio/Commercn), [dev.to](https://dev.to/jqueryscript/commercn-a-ui-component-library-that-speeds-up-ecommerce-development-26h5)
- stackzero-labs/ui (the project often called "Commerce UI"): "Collection of components to build e-commerce sites and commerce apps"; 266 stars; last push 2025-09-01, over 14 months without commits. Source: [github.com/stackzero-labs/ui](https://github.com/stackzero-labs/ui)
- A GitHub search for "shadcn ecommerce components" sorted by stars returns stackzero-labs/ui (266) at the top; everything else is a starter or demo with under 50 stars. Source: [GitHub search](https://github.com/search?q=shadcn+ecommerce+components&type=repositories&s=stars)
- Tailwind UI Ecommerce launched Aug 11, 2021 as "the first all-new component kit for Tailwind UI since its initial launch in February 2020", with over 100 components in 14 categories (Product Overviews, Product Lists, Category Previews, Shopping Carts, Category Filters, Product Quickviews, Store Navigation, Promo Sections, Checkout Forms, Customer Reviews, Order Summaries, plus Storefront, Product and Order History pages) and 7 page example categories. Source: [tailwindcss.com/blog/tailwind-ui-ecommerce](https://tailwindcss.com/blog/tailwind-ui-ecommerce)
- The Ecommerce kit was also sold separately for a one-time USD 149 (search snippet of the UI Blocks page). Source: [tailwindcss.com/plus/ui-blocks](https://tailwindcss.com/plus/ui-blocks)
- shadcnblocks added a dedicated ecommerce collection on Jan 17, 2026: 23 block types in six groups (Product Discovery, Product Details, Shopping and Checkout, Customer Account, Marketing and Trust, Store Essentials). The post gives no demand data. Source: [shadcnblocks.com/blog/new-ecommerce-blocks](https://www.shadcnblocks.com/blog/new-ecommerce-blocks)
- shadcnblocks' ecommerce landing page advertises "122+ Shadcn UI Ecommerce blocks" (search snippet), while the category listing I fetched sums to roughly 300 commerce blocks (see section 4). The two figures conflict; the listing is newer. Source: [shadcnblocks.com/blocks/ecommerce](https://www.shadcnblocks.com/blocks/ecommerce), [shadcnblocks.com/blocks](https://www.shadcnblocks.com/blocks)
- ReUI (Keenthemes): ecommerce blocks for product card, checkout, cart, coupons; pages cite 87 to 94 ecommerce blocks; ReUI Pro recently launched with early-bird pricing. Repo: "Design-forward shadcn kit... 1000+ free patterns", 4,087 stars. Source: [reui.io/blocks/ecommerce/product-card](https://reui.io/blocks/ecommerce/product-card), [github.com/keenthemes/reui](https://github.com/keenthemes/reui)
- Creative Tim: "58+ Ecommerce UI Blocks based on shadcn/ui" in 7 categories, free and PRO. Source: [creative-tim.com/ui/blocks/ecommerce-ui](https://www.creative-tim.com/ui/blocks/ecommerce-ui)
- Shadcn Studio and Shadcnspace both carry an eCommerce block group (carts, checkout, product lists). Source: [shadcnstudio.com/pages/pricing-page](https://shadcnstudio.com/pages/pricing-page), [shadcnspace.com/blocks/ecommerce/checkout](https://shadcnspace.com/blocks/ecommerce/checkout)
- 21st.dev publishes a roundup of React product card and checkout components, showing commerce is a browsed category in its marketplace. Source: [21st.dev/blog/react-product-card-checkout-components](https://21st.dev/blog/react-product-card-checkout-components)
- Flowbite (Tailwind component framework, 9,384 stars; flowbite-react 181,242 npm downloads per week) is a horizontal library that carries an E-commerce UI block category. I could not load its blocks page to get counts. Source: [github.com/themesberg/flowbite](https://github.com/themesberg/flowbite), [npmjs.com/package/flowbite-react](https://www.npmjs.com/package/flowbite-react), [flowbite.com/blocks](https://flowbite.com/blocks/)
- Shopify Polaris React: the repo is now Shopify/polaris-react-archive, marked "(Deprecated)" and archived, 6,150 stars; `@shopify/polaris` still has 398,419 npm downloads per week. Polaris is for Shopify admin apps, not storefronts. Source: [github.com/Shopify/polaris-react-archive](https://github.com/Shopify/polaris-react-archive), [npmjs.com/package/@shopify/polaris](https://www.npmjs.com/package/@shopify/polaris)
- Shopify Hydrogen: "Shopify commerce primitives in your framework"; 2,176 stars; 133,065 npm downloads per week; active (push 2026-11-12). Source: [github.com/Shopify/hydrogen](https://github.com/Shopify/hydrogen), [npmjs.com/package/@shopify/hydrogen](https://www.npmjs.com/package/@shopify/hydrogen)
- Medusa UI: the standalone repo medusajs/ui ("Medusa's admin component library") is archived at 118 stars (moved into the monorepo), but `@medusajs/ui` has 389,345 npm downloads per week because it ships with the Medusa admin; Medusa core has 37,207 stars and now describes itself as "commerce platform for agents and developers". Source: [github.com/medusajs/ui](https://github.com/medusajs/ui), [npmjs.com/package/@medusajs/ui](https://www.npmjs.com/package/@medusajs/ui), [github.com/medusajs/medusa](https://github.com/medusajs/medusa)
- Storefront starters: vercel/commerce (Next.js Commerce) 14,310 stars but archived; medusajs/nextjs-starter-medusa 2,783 stars, archived; saleor/storefront 1,644 stars, active; vendurehq/storefront-remix-starter 228 stars, last push 2025-12-18. Source: [github.com/vercel/commerce](https://github.com/vercel/commerce), [github.com/medusajs/nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa), [github.com/saleor/storefront](https://github.com/saleor/storefront), [github.com/vendurehq/storefront-remix-starter](https://github.com/vendurehq/storefront-remix-starter)
- A headless Shopify guide advises building cart UI with shadcn but never the payment step, since Shopify's hosted checkout handles payment. Source: [vp0.com](https://vp0.com/blogs/shadcn-blocks-for-headless-shopify)

### Inferences
- Evidence points to "stagnating" for commerce-only shadcn registries: the two best known (stackzero 266 stars, dormant since Sept 2025; Commercn 81 stars, about 12 blocks) are two orders of magnitude below horizontal libraries, and neither appears to monetize.
- Evidence points to "thriving as a module" for commerce inside horizontal catalogs: Tailwind added it in 2021, shadcnblocks in Jan 2026 and scaled it to hundreds of blocks within months, ReUI, Creative Tim, Shadcn Studio and Flowbite all carry it. Vendors keep investing, which suggests buyers do use it.
- What all of these commerce offerings sell is functional, static commerce UI: product cards, lists, carts, checkout forms, order history. None of the sources positions on animation, campaign or seasonal landing pages, or storytelling scenes. That is a different product from "animated blocks for commerce and campaign pages", so the dead standalone registries are weak evidence against SunUI's niche, and the horizontal catalogs are not direct substitutes.
- Platform-bound kits (Polaris, Medusa UI, Hydrogen) have large download numbers because of platform lock-in, not library appeal. Polaris React being deprecated and Next.js Commerce and the Medusa starter being archived shows even platform-backed commerce front-end kits get abandoned or folded in.
- The checkout step is structurally removed from the addressable surface for the many stores on hosted checkouts (Shopify), which shrinks the "functional commerce UI" market and leaves the pre-checkout, persuasion-heavy pages (product story, campaign, promo) as the part where custom front-end work still happens.

### Gaps
- No sales or customer figures exist for any commerce category or commerce-only product (Tailwind Ecommerce kit sales share, shadcnblocks ecommerce usage, ReUI Pro).
- Flowbite e-commerce block counts and Flowbite Pro price not retrieved.
- I did not survey paid Shopify theme or Hydrogen template marketplaces, or Framer/Webflow commerce templates, which may be the real competitors for campaign pages.
- No registry-directory level count of how many shadcn registries tag themselves ecommerce.

## 3. Cases of starting narrow then broadening, or starting broad then adding vertical packs

### Takeaway
The clear pattern is broad first, vertical pack later (Tailwind UI 2020 to Ecommerce 2021; shadcnblocks 2023 to ecommerce Jan 2026), and motion-niche first, then broadening into generic page blocks, app UI and templates (Aceternity, Magic UI, React Bits 2026). The one well-known vertical-first library, Tremor (dashboards), stayed narrow and exited by acquisition rather than broadening.

### Cited Findings
- Broad then vertical: Tailwind UI launched Feb 2020 with marketing and application UI, then shipped Ecommerce on Aug 11, 2021 as its first new kit, about 18 months later. Source: [tailwindcss.com/blog/tailwind-ui-ecommerce](https://tailwindcss.com/blog/tailwind-ui-ecommerce)
- Broad then vertical: shadcnblocks, established 2023 on marketing blocks, added ecommerce blocks Jan 17, 2026, and also sells an Admin Kit (200+ screens) and CMS packs (Payblocks, Sanityblocks at USD 379 list each). Source: [shadcnblocks.com/blog/new-ecommerce-blocks](https://www.shadcnblocks.com/blog/new-ecommerce-blocks), [shadcnblocks.com/pricing](https://www.shadcnblocks.com/pricing)
- Narrow (effect components) then broad: Aceternity started as a free library of 7 animated components built over a weekend, launched Pro about four months later, and by 2026 sells blocks, full pages and 30+ templates plus an AI builder sponsor product (Acebuilder). Source: [Starter Story, Oct 2024](https://www.starterstory.com/stories/aceternity-ui), [ui.aceternity.com/brand-facts](https://ui.aceternity.com/brand-facts)
- Narrow (animation effects) then broad: React Bits was a free animated-component library; React Bits Pro (Feb 11, 2026) added 300 page blocks, 300 app UI blocks including dashboards, data tables and settings forms, and 15 templates. Source: [pro.reactbits.dev/about](https://pro.reactbits.dev/about), [Product Hunt](https://www.producthunt.com/products/react-bits-pro/launches)
- Narrow (animated components) then landing templates: Magic UI free is 150+ animated components; Pro is landing sections and nine templates by startup type (AI Agent, Dev Tool, Mobile, SaaS, Startup, Portfolio). Source: [magicui.design](https://magicui.design), [pro.magicui.design](https://pro.magicui.design/)
- Vertical and stayed vertical: Tremor was "React components to build charts and dashboards" from the start and was acquired by Vercel on Jan 22, 2025; the original npm repo has had no pushes since 2025-01-13. Source: [vercel.com/blog/vercel-acquires-tremor](https://vercel.com/blog/vercel-acquires-tremor), [github.com/tremorlabs/tremor-npm](https://github.com/tremorlabs/tremor-npm)
- Narrow then absorbed: Origin UI (copy-paste app components) was acquired by Cal.com and became coss ui, "the official design system of Cal.com", launched Oct 15, 2025. Source: [coss.com/ui/docs/roadmap](https://coss.com/ui/docs/roadmap), [Product Hunt](https://www.producthunt.com/p/cal/coss-com-ui)
- Marketplace then infrastructure: 21st.dev began as a component marketplace ("npm for design engineers") and by its YC W2026 batch is described as going "all-in on agent infrastructure". Source: [github.com/serafimcloud/21st](https://github.com/serafimcloud/21st), [startuphub.ai](https://www.startuphub.ai/news/claudes-corner-21st-dev-yc-w2026)
- Platform kit that broadened its framing: Medusa now describes itself as a commerce platform "for agents and developers". Source: [github.com/medusajs/medusa](https://github.com/medusajs/medusa)

### Inferences
- I found no example of a library that started commerce-only and then successfully broadened. The successful "narrow start" cases were narrow by technique or aesthetic (animation, dashboards and charts, form inputs), not by industry vertical.
- Vertical packs are sold as add-ons to an existing audience (Tailwind Ecommerce at USD 149 standalone, shadcnblocks admin and CMS kits). Distribution came first, the vertical second.
- The broadening path for motion libraries is consistent: free effects build audience, then paid tier sells what a buyer assembles into a page (sections, templates). All of them broadened toward SaaS and AI startup landing pages, none toward commerce.
- A wedge reading that fits the evidence: a distinctive technique or look (which SunUI has: paper feel, composed animated scenes) is the proven narrow start. An industry label on its own has not been shown to work as a wedge in this ecosystem, but it also has not been tried by anyone with strong motion craft.

### Gaps
- Exact Aceternity and Magic UI launch dates for free and Pro tiers were not retrieved from primary sources (Aceternity "founded 2023" per its site; Starter Story lists the business start as March 2021, which likely refers to the agency).
- No founder statement was found explaining why any library chose or avoided a vertical.

## 4. Which page types dominate catalogs; is commerce under-served or low-demand

### Takeaway
Catalogs are dominated by SaaS and AI startup landing-page sections (hero, features, pricing, CTA, testimonials, bento) and, secondarily, app UI (dashboards, sidebars, tables, auth). Commerce is covered in volume only by the big static block libraries (about 10 percent of shadcnblocks) and is essentially absent from every motion-heavy library, so animated commerce is an unserved niche whose demand is unproven rather than disproven.

### Cited Findings
- shadcnblocks category counts (fetched 2026-11-13): Feature 334, Hero 292, Background Pattern 145, Gallery 142, Blog 134, Pricing 96, CTA 56, Bento 54, Coverflow 54, Product Detail 52, Team 48, Application Shell 47, Contact 46, Footer 45, Product List 44, Testimonial 40, Logos 40, FAQ 38, Data Table 32, Dashboard 31, Product Card 28, Product Categories 25, Product Gallery 21, Reviews 21, Shopping Cart 17, Ecommerce Hero 13, Checkout 11, Promo Banner 11, Shop The Look 10, Product Quick View 10. No AI or chat category appears. Source: [shadcnblocks.com/blocks](https://www.shadcnblocks.com/blocks)
- Summing the clearly commerce categories on that page (product detail, list, card, categories, gallery, cart, ecommerce hero, checkout, quick view, search, shop the look, order summary, compare products, ecommerce footer and navbar, bundles, order management and history, wishlist, deals, payment methods, inventory, specs) gives about 306 of 2,866 blocks, about 11 percent. Hero plus Feature alone are 626, about 22 percent. My arithmetic from the same page. Source: [shadcnblocks.com/blocks](https://www.shadcnblocks.com/blocks)
- Official shadcn/ui blocks cover only app UI (sidebar, login, signup, dashboard). No marketing, no commerce. Source: [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)
- Magic UI Pro sections: Header, Hero, Social Proof, Feature Scroll, Feature Slideshow, Feature Cards, Pricing, CTA, FAQ, Footer; templates AI Agent, Dev Tool, Mobile, SaaS, Startup, Portfolio, Changelog, Blog, Codeforge. No commerce. Source: [pro.magicui.design](https://pro.magicui.design/)
- React Bits Pro: 300 page blocks in 22 categories (heroes, feature grids, pricing tables, FAQs, testimonials, CTAs, footers) and 300 app UI blocks in 38 categories (dashboards, sidebars, data tables, settings forms, dialogs, AI agent surfaces); templates SaaS, AI SaaS, AI app, agency, shader, security, 8-bit. No commerce mentioned. Source: [pro.reactbits.dev/about](https://pro.reactbits.dev/about)
- Aceternity targets "developers building SaaS landing pages, portfolios, and modern web applications"; templates are agency, marketing, SaaS, portfolio, AI agent. Customers are mainly early-stage startups, many YC-backed. Source: [ui.aceternity.com/brand-facts](https://ui.aceternity.com/brand-facts), [Starter Story](https://www.starterstory.com/stories/aceternity-ui)
- Tailwind Plus treats Ecommerce as one of three equal top-level kits alongside Marketing and Application UI. Source: [tailwindcss.com/blog/tailwind-ui-ecommerce](https://tailwindcss.com/blog/tailwind-ui-ecommerce)
- Shadcn Studio's six block groups include both Dashboard and Application and eCommerce UI. Source: [shadcnstudio.com/pages/pricing-page](https://shadcnstudio.com/pages/pricing-page)

### Inferences
- The buyer these libraries are built for is a developer or founder shipping a SaaS or AI product site. That buyer is over-served: at least eight libraries in this set sell near-identical hero, pricing, bento and testimonial sections at USD 150 to 350.
- Commerce is neither a blank gap nor a dead corner. Static commerce UI is commoditized (hundreds of free and paid blocks). Animated or campaign-grade commerce pages are a blank spot in every motion library I checked.
- Two competing readings the report writer should weigh. Reading A (gap): motion libraries skip commerce only because their founders and audience are SaaS people, so an animated commerce library has no direct competitor. Reading B (low demand): the people who build stores mostly use Shopify themes, page builders or agencies with their own kits, and do not shop for React block registries, which would explain why commerce-only registries sit under 300 stars. The evidence here cannot separate A from B. The existence of sustained investment by shadcnblocks, ReUI and Tailwind in commerce blocks supports at least some React-developer demand.
- Commerce-adjacent page types that are scarce everywhere, including in the big catalogs: campaign and seasonal promo pages (shadcnblocks has Promo Banner 11, Deals 5, Offer Modal 12), product storytelling, lookbooks ("Shop The Look" 10). These are exactly the "campaign" half of SunUI's current tagline.

### Gaps
- No direct demand data (search volume, install counts per category, sales by category) was found for commerce versus SaaS blocks.
- Counts for Tailwind Plus sub-categories, Flowbite, ReUI totals by category were not retrieved, so the "about 10 percent commerce" share is based on one vendor.
- I did not check whether any catalog has an explicit AI chat category with counts (React Bits Pro mentions "AI agent surfaces"; shadcnblocks showed none).

## 5. Differentiators of motion-heavy libraries and whether they are vertical-agnostic

### Takeaway
Magic UI, Aceternity, React Bits, Animate UI, Cult UI and Motion Primitives all differentiate on visual wow, copy-paste ownership of source, shadcn CLI compatibility and, since 2026, AI-agent readiness. They are nominally vertical-agnostic but in practice are tuned to SaaS, AI and dev-tool startup landing pages, and none claims a commerce or campaign use case.

### Cited Findings
- Magic UI: identity is a persona, "UI library for Design Engineers", plus "perfect companion for shadcn/ui"; social proof is YC startup landing pages. Source: [magicui.design](https://magicui.design)
- Aceternity: "Animated components, blocks, full pages, interactions and templates"; copy-paste, works with shadcn CLI, and tells users to "let your AI agent do it"; brand built on free-first giving and X virality (Fireship video, Product Hunt). Source: [ui.aceternity.com/brand-facts](https://ui.aceternity.com/brand-facts), [Starter Story](https://www.starterstory.com/stories/aceternity-ui)
- React Bits: scale claim ("largest open-source library of animated, interactive, and customizable" components), effect-heavy items (hero shaders, particle text, fluid cursors, 3D scenes, glitch text), source delivered as code you own instead of a runtime dependency, components in multiple CSS variants, and an Agent Kit (20 design skills, page prompts, recipes) with a dedicated "best for AI coding agents" page and llms.txt. Source: [github.com/DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), [pro.reactbits.dev/about](https://pro.reactbits.dev/about), [pro.reactbits.dev/best-for/ai-coding-agents](https://pro.reactbits.dev/best-for/ai-coding-agents)
- React Bits Pro segments its marketing by buyer type (indie hackers, startup founders, agencies and freelancers, AI coding agents), not by industry. Source: [pro.reactbits.dev/best-for/agencies](https://pro.reactbits.dev/best-for/agencies), [pro.reactbits.dev/best-for/indie-hackers](https://pro.reactbits.dev/best-for/indie-hackers)
- Animate UI: "fully animated, open-source component distribution" built on Motion and the shadcn CLI, i.e. animated versions of standard primitives. Source: [github.com/imskyleen/animate-ui](https://github.com/imskyleen/animate-ui)
- Cult UI: "Animated components for design engineers", 150+ free shadcn/ui components. Source: [github.com/nolly-studio/cult-ui](https://github.com/nolly-studio/cult-ui)
- Motion Primitives: "UI kit to make beautiful, animated interfaces, faster". Source: [github.com/ibelick/motion-primitives](https://github.com/ibelick/motion-primitives)
- Paid tiers of the motion libraries all monetize the same way: free effects, paid sections and templates, one-time lifetime price (Magic UI Pro USD 199, Aceternity USD 199, React Bits Pro USD 129 to 349, Cult UI Pro about USD 179). Source: [pro.magicui.design](https://pro.magicui.design/), [ui.aceternity.com/brand-facts](https://ui.aceternity.com/brand-facts), [pro.reactbits.dev/about](https://pro.reactbits.dev/about), [pro.cult-ui.com/pricing](https://www.pro.cult-ui.com/pricing)

### Inferences
- Shared differentiators, in order of how often they appear: (1) eye-catching effects, (2) copy-paste source ownership and shadcn CLI install, (3) a persona label ("design engineers"), (4) free-first with lifetime paid tier, (5) agent readiness (MCP, llms.txt, skills). None of these is vertical-specific, and none is defensible on its own since all competitors claim them.
- Their aesthetic is strongly coded: dark mode, gradients, beams, shaders, bento grids. That look reads as "tech startup" and transfers poorly to retail, food, fashion or seasonal campaigns. SunUI's paper-feel look and commerce and campaign subject matter are differentiated on aesthetic and on page type, not on business model, which is identical (free atoms and motion libs, paid composed scenes).
- Because competitors segment by buyer type (agencies, founders, indie hackers), a commerce or campaign positioning can be expressed as a buyer segment (agencies and in-house teams building store and campaign pages) without relabeling the catalog as an industry vertical.
- Risk shared with all of them: the Tailwind Labs case shows that when agents pull free components directly, the human never sees the paid upsell. Motion libraries are responding by selling agent kits and scenes or templates that are harder to regenerate. This supports a "paid composed scenes" model regardless of whether the positioning is commerce-only or broader.

### Gaps
- No data on what share of motion-library buyers use them for commerce sites.
- Skiper UI and Kokonut UI positioning and differentiators were not verified from primary pages.
- No primary source checked for Magic UI or Aceternity MCP or registry features beyond the brand-facts page.
