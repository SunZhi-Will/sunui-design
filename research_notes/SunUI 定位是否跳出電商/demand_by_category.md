# Buyer demand for paid UI kits, component libraries and templates by use case (2025 to 2026)

Research date: 2026-11-13. Every data point carries its own date. "Hard" = a number read from a primary page or API on the stated date. "Estimate" = third-party, self-reported, or my own tally. Source format is "(Source: link)" because this repo forbids em dashes.

## 1. Template marketplaces: share of listings and best sellers by category

### Takeaway
On every marketplace where I could read a number, e-commerce is a visible but minority category (roughly 13 to 17 percent of catalog in developer block libraries), while the best-seller slots are held by admin dashboards and multipurpose/SaaS marketing templates. No marketplace publishes sales by category, so the share of revenue is inferred from rankings, not measured.

### Cited Findings
- HARD (read 2026-11-13). ThemeForest "Site Templates" (HTML) states "over 24,900 HTML templates" across 12 subcategories: Corporate, Retail, Creative, Admin Templates, Technology, Personal, Entertainment, Specialty Pages, Nonprofit, Mobile, Miscellaneous, Wedding. Per-subcategory counts are not shown on the page. (Source: [ThemeForest site templates](https://themeforest.net/category/site-templates))
- HARD (read 2026-11-13). ThemeForest HTML "Top selling" lifetime sales: Metronic 120.4K, Canvas 74.2K, Porto 53.7K, Fuse 26K. "Weekly bestsellers" include Vuexy (30.7K lifetime) and Velzon (14.4K lifetime). "Top rated": Skote (4.7K). (Source: [ThemeForest site templates](https://themeforest.net/category/site-templates))
- ESTIMATE (search snapshot, undated, filter state unclear). One cached ThemeForest attribute view showed 43,961 results overall with eCommerce 4,288 and WordPress 12,155; another showed eCommerce 1,344 of 3,907. These are filtered views and should not be quoted as marketplace shares. (Source: [ThemeForest attribute listing](https://themeforest.net/attributes/themeforest-files-included/psd))
- HARD (read 2026-11-13). Framer Marketplace lists 50 template categories. Top-level groups in nav order: Portfolio (Artists, Designers, Photography, Resume), Software (AI, Apps, Fintech, SaaS), Agency (Architecture, Design, Marketing, Web), Ecommerce (Beauty, Digital, Fashion, Furniture), Services, Health, Publishing, Real Estate, Hospitality, Events. No per-category counts are shown. There is no "landing page" category. (Source: [Framer template categories](https://www.framer.com/marketplace/templates/category/))
- HARD (page dated 2026-11-12). Framer reports $6.5M in 2025 creator payouts and $753,000 paid to creators "in November" (year not stated). Self-reported creator months on the same page: Anatolii Dmitrienko $36,735 in one July ($28,487 direct template sales); Hamza Ehsan $24,080 in May 2025 and $21,733 in June 2025. (Source: [Framer creators](https://www.framer.com/creators))
- HARD (read 2026-11-13). shadcn.io template directory: 229 templates total (215 open source, 14 premium). Counts are shown only for tech tags (Tailwind 196, React 186, Next.js 166, Full-stack 46), not for use cases. (Source: [shadcn.io templates](https://www.shadcn.io/template))
- HARD (read 2026-11-13). Vercel's e-commerce template page lists 21 templates. The default (unfiltered) Vercel templates list opens with ten AI agent templates in a row (for example "eve Contentful Agent", "eve Marketing Team", "eve Incident Response Agent"). (Source: [Vercel ecommerce templates](https://vercel.com/templates/ecommerce); [Vercel templates](https://vercel.com/templates))
- ESTIMATE (third-party, conflicting). Webflow template totals are quoted as "1,000+", "2,000+", "over 7,000" and "10,000+" by different third-party guides and scrapers; a scraper describes 26 supported categories. No official count or category split was found. (Source: [Apify Webflow templates scraper](https://apify.com/parseforge/webflow-templates-marketplace-scraper); [thecssagency guide](https://www.thecssagency.com/blog/best-webflow-templates))

### Inferences
- From my own product knowledge (not stated on the ThemeForest page): Metronic, Fuse, Vuexy, Velzon and Skote are admin dashboard templates; Canvas and Porto are multipurpose site templates. That means five of the seven named long-run and weekly HTML best sellers are admin dashboards and none is a pure storefront template. On ThemeForest, storefront money sits in the WordPress/WooCommerce and Shopify theme sections, not in the HTML/React section that a developer library competes in.
- Framer's own navigation order (Portfolio, Software, Agency, then Ecommerce) is a weak signal of where its volume is. Framer has no native checkout comparable to Shopify, so e-commerce there is structurally small.
- Vercel leading its gallery with AI agent templates suggests AI products are the category the platform sees most pull for in late 2026.

### Gaps
- No marketplace publishes sales or revenue by category. All "share of best sellers" statements above are rankings read off public pages plus my classification.
- ThemeForest per-subcategory counts, Webflow per-category counts, and Framer per-category counts could not be read (not rendered in fetched pages, or the fetch failed for webflow.com/templates).
- Gumroad and Lemon Squeezy UI kit category data: not researched; these have no public category best-seller lists that I could find.

## 2. Developer-facing paid libraries: which categories sell

### Takeaway
The paid React/Tailwind libraries are overwhelmingly built around marketing/landing sections and application UI, with e-commerce as a third, smaller pack. The one founder disclosure with a category label (Aceternity) describes itself as a "landing page" business, and the whole segment's revenue has been falling sharply since 2025 because of AI code generation.

### Cited Findings
- HARD (read 2026-11-13). shadcnblocks lists 2,866+ blocks and 22 templates. Largest categories: Feature 334, Hero 292, Background Pattern 145, Gallery 142, Blog 134, Pricing 96, CTA 56, Coverflow 54, Bento 54, Product Detail 52, Team 48, Application Shell 47, Contact 46, Footer 45, Product List 44. E-commerce categories exist but are small individually: Product Card 28, Product Categories 25, Product Gallery 21, Reviews 21, Shopping Cart 17, Ecommerce Hero 13, Offer Modal 12, Checkout 11, Promo Banner 11, Deals 5. (Source: [shadcnblocks blocks](https://www.shadcnblocks.com/blocks))
- ESTIMATE (my tally of the shadcnblocks list above, 2026-11-13; category assignment is my judgment). E-commerce-type blocks: about 374 of 2,866 (about 13%). Application/dashboard/auth blocks: about 361 (about 13%). Marketing and content sections: the remaining roughly 74%. (Source: [shadcnblocks blocks](https://www.shadcnblocks.com/blocks))
- HARD. Tailwind Plus official pages describe "500+" UI blocks across three packs: Marketing, Application UI, Ecommerce. Templates named on official pages: Catalyst (application UI kit), Salient and Radiant (SaaS marketing), Oatmeal (SaaS marketing kit), Pocket (app marketing), Primer (info product), Spotlight (personal site). No storefront template is in that list. (Source: [Tailwind Plus UI blocks](https://tailwindcss.com/plus/ui-blocks); [Salient](https://tailwindcss.com/plus/templates/salient); [Catalyst](https://tailwindcss.com/plus/templates/catalyst))
- ESTIMATE (unofficial third-party catalog, undated). Tailwind Plus component counts: Marketing 166, Application UI 414, Ecommerce 118. That would put e-commerce at about 17% of components. The total (698) does not match the official "500+" wording, so treat as approximate. (Source: [claudskills Tailwind Plus catalog](https://claudskills.com/skills/tailwindplus/SKILL.md))
- HARD (self-reported, article dated 2024-10-08). Aceternity UI: about $80K/month total, of which about $40K from Aceternity UI Pro and about $30K from web design and development services; range $60K to $100K per month. The Starter Story headline calls it a "Landing Page SaaS For Developers". Customers named: web developers, founders, early-stage startups including YC-backed companies. (Source: [Starter Story, Aceternity UI](https://www.starterstory.com/stories/aceternity-ui))
- HARD (self-reported). Tailwind UI brought in nearly $2M in its first five months after the 2020 launch. (Source: [Adam Wathan](https://adamwathan.me/tailwindcss-from-side-project-byproduct-to-multi-mullion-dollar-business/))
- HARD (reported early 2026). Tailwind Labs said revenue was down about 80% and laid off 75% of its engineering team (3 of 4 engineers), attributing it to AI tools; docs traffic was down about 40% since early 2023 while framework usage grew. (Source: [Leanware](https://leanware.co/insights/tailwind-ai-crisis); [ppc.land](https://ppc.land/tailwind-css-lays-off-75-of-engineering-team-as-ai-impacts-revenue/))
- HARD (self-reported, founder post 2026-10-20, TrustMRR 2026-10-21). ShipFast (Next.js SaaS boilerplate): about $126K/month in 2024, $25K/month in 2025, $2K/month in 2026; $1,272,892 lifetime; about $1,993 in the last 30 days. Founder attributed the fall mainly to AI (2026-09-11). More than 7,200 developers bought it. (Source: [aiidelist analysis](https://aiidelist.com/blog/shipfast-revenue-collapse-marc-lou-2026))
- ESTIMATE (conflicting third-party guesses). Untitled UI: one profile assumes $25K+/month, a data site estimates $171,110/year. Untitled UI React launched 2025-07-17 and was #1 Product of the Day on Product Hunt with 628 upvotes. (Source: [Prospeo](https://prospeo.io/c/untitled-ui-revenue); [hunted.space](https://hunted.space/product/untitled-ui/launches/untitled-ui-react))
- No revenue disclosure found for shadcnblocks or Magic UI Pro. (Source: [everydev shadcnblocks profile](https://www.everydev.ai/developers/shadcnblocks))

### Inferences
- Catalog composition is a lagging indicator of what sellers believe sells. Two independent catalogs (shadcnblocks, Tailwind Plus) both put e-commerce in the 13 to 17% range, with marketing sections and app UI taking the rest. A library limited to e-commerce and campaign pages is addressing the smallest of the three standard packs in this segment.
- The highest disclosed revenues in this segment (Tailwind UI, Aceternity, ShipFast) all came from SaaS founders and developers buying landing pages, app UI and SaaS starters. None of the disclosed winners is e-commerce led.
- The counterpoint for the report writer: the generic SaaS landing/dashboard segment is exactly where AI generation has destroyed pricing power (Tailwind down about 80%, ShipFast down about 98%). Larger market does not mean healthier market in late 2026. The aiidelist article's hypothesis is that specialized, hard-to-generate work is more defensible, but it labels that a hypothesis.

### Gaps
- No library publishes sales by category or a best-seller list by use case. Magic UI Pro, shadcnblocks, Untitled UI: no founder revenue numbers found.
- Tailwind Plus official per-pack counts could not be read (pages returned a login wall).
- The Indie Hackers post "From simple theme to $65k/mo ecosystem" returned HTTP 403 and is unread.

## 3. Who buys, and what developers build

### Takeaway
Disclosed buyers of paid developer libraries are solo developers, indie hackers, founders and early-stage startups; I found no evidence of in-house e-commerce teams as a meaningful buyer group. Developer surveys did not yield a usable "what do you build" split in this session.

### Cited Findings
- Aceternity's stated customers (2024-10): web developers, founders who want to ship quickly, early-stage and small businesses, several YC-backed companies. (Source: [Starter Story, Aceternity UI](https://www.starterstory.com/stories/aceternity-ui))
- ShipFast buyers (through 2026-10): more than 7,200 developers, sold as a one-time purchase from $199 to people launching SaaS products. (Source: [aiidelist analysis](https://aiidelist.com/blog/shipfast-revenue-collapse-marc-lou-2026))
- Framer template buyers are served by creators who came from client work; one creator reports quitting client work in April 2024 once template sales reached $2,970/month. (Source: [Framer creators](https://www.framer.com/creators))
- State of React 2025 ran 2025-11-19 to 2026-01-13 with 3,760 respondents; coverage found focused on libraries (TanStack, Next.js sentiment), not on application types. (Source: [The Register, 2026-02-17](https://www.theregister.com/2026/02/17/react_survey_shows_tanstack_gains/); [State of React 2025](https://survey.devographics.com/survey/state-of-react/2025))

### Inferences
- The buyer of a React/Tailwind/shadcn block library is by construction someone who writes React. In-house e-commerce marketers on hosted platforms do not, which limits the reachable buyers for e-commerce blocks to developers at headless-commerce brands, agencies and freelancers.

### Gaps
- No survey figure found for the share of React or Tailwind developers building e-commerce versus SaaS versus marketing sites. State of JS, State of CSS, Stack Overflow and Tailwind surveys were not opened; I cannot confirm whether they contain such a question.
- No buyer-segment breakdown (indie, startup, freelancer, agency, in-house) from any vendor.

## 4. Search and interest signals

### Takeaway
On GitHub, dashboard and portfolio projects outnumber e-commerce by wide margins in the shadcn and Tailwind ecosystems; e-commerce is the smallest or second smallest of the named use cases in every query I ran. These are supply-side counts of repositories, not buyer searches, and Google Trends data was not obtained.

### Cited Findings
- HARD (GitHub search API, repositories matching name or description, 2026-11-13). "shadcn dashboard" 3,553; "shadcn admin" 1,755; "shadcn portfolio" 1,569; "shadcn saas" 857; "shadcn landing page" 779; "shadcn ecommerce" 554. (Source: [GitHub search: shadcn dashboard](https://github.com/search?q=shadcn+dashboard+in%3Aname%2Cdescription&type=repositories); [GitHub search: shadcn ecommerce](https://github.com/search?q=shadcn+ecommerce+in%3Aname%2Cdescription&type=repositories))
- HARD (same method, 2026-11-13). "tailwind portfolio" 46,212; "tailwind dashboard" 20,289; "tailwind landing page" 19,427; "tailwind ecommerce" 6,557. (Source: [GitHub search: tailwind ecommerce](https://github.com/search?q=tailwind+ecommerce+in%3Aname%2Cdescription&type=repositories); [GitHub search: tailwind dashboard](https://github.com/search?q=tailwind+dashboard+in%3Aname%2Cdescription&type=repositories))
- HARD (same method, 2026-11-13). "nextjs ecommerce template" 475; "nextjs dashboard template" 434; "nextjs saas starter" 334; "nextjs portfolio template" 298; "nextjs landing page template" 183. (Source: [GitHub search: nextjs ecommerce template](https://github.com/search?q=nextjs+ecommerce+template+in%3Aname%2Cdescription&type=repositories))
- HARD (GitHub topic counts, 2026-11-13). portfolio 99,697; dashboard 54,598; ecommerce 34,824; portfolio-website 30,358; landing-page 22,104; saas 16,791; admin-dashboard 7,175; ecommerce-website 5,270; admin-template 840; saas-boilerplate 631. (Source: [GitHub topic: ecommerce](https://github.com/topics/ecommerce); [GitHub topic: dashboard](https://github.com/topics/dashboard); [GitHub topic: landing-page](https://github.com/topics/landing-page))
- HARD (same method, 2026-11-13). "black friday landing page" matches 168 repositories on all of GitHub. (Source: [GitHub search: black friday landing page](https://github.com/search?q=black+friday+landing+page+in%3Aname%2Cdescription&type=repositories))

### Inferences
- Within shadcn specifically, dashboard plus admin (5,308) is about 9.6 times e-commerce (554); landing page plus SaaS (1,636) is about 3 times e-commerce.
- Next.js is the one place where e-commerce templates are on par with dashboards (475 versus 434), consistent with Next.js Commerce style starters. E-commerce on GitHub skews toward full-stack store starters, not UI blocks.
- Portfolio counts are inflated by developers' own sites and say little about paid demand.
- 168 repositories for Black Friday landing pages across all of GitHub suggests seasonal campaign pages are rarely built as reusable code projects.

### Gaps
- Google Trends relative interest for "shadcn landing page", "shadcn dashboard", "shadcn ecommerce", "react ecommerce template", "tailwind ecommerce components": not obtained (no tool access to Trends data). This is the main missing demand-side signal.
- npm download comparisons and shadcn registry directory tag counts by use case: not obtained.

## 5. Seasonal campaign pages: who builds them

### Takeaway
The evidence found points to seasonal campaign pages being built inside hosted commerce platforms with page builders and theme editors, and by agencies producing LPs, not by developers buying React components. I found no evidence, in any of Taiwan, Japan, China or Southeast Asia, of developers purchasing React components for Black Friday, Double 11, 618 or Lunar New Year pages.

### Cited Findings
- SHOPLINE offers a first-party "Smart Landing Page" app installed from the admin, with built-in analytics (visits, bounce rate) and optimization hints; it does not support OS 3.0 themes. (Source: [SHOPLINE Help: Smart Landing Page](https://help.shopline.com/hc/en-001/articles/4410530405017))
- SHOPLINE's theme editor supports page templates, up to 1,000 per theme. (Source: [SHOPLINE Help: templates](https://help.shopline.com/hc/en-001/articles/6949333847961))
- SHOPLINE OS 3.0 themes let merchants generate custom sections (image banners, promo blocks) with AI inside the theme editor, limited to 3 generations per store per 24 hours (limited release). (Source: [SHOPLINE Help: AI-generated sections](https://help.shopline.com/hc/zh-cn/articles/58503421684377))
- Third-party drag-and-drop builders with ready-made campaign templates exist for SHOPLINE as well as Shopify (EComposer). (Source: [EComposer on SHOPLINE](https://help.ecomposer.io/docs/ecomposer-shopline/quick-start/how-to-install-ecomposer-on-shopline/))
- ESTIMATE (third-party tracker, June 2026, read from a search summary and not opened). PageFly Landing Page Builder is used by about 83,490 Shopify stores; its share of scanned stores fell from 7.0% to 6.0% in one recent quarter across a scan of more than 3.5 million stores. (Source: [ShopThemeDetector Shopify statistics](https://shopthemedetector.com/shopify-statistics/2026))
- SHOPLINE Taiwan reported record Double 11 results for a third straight year in 2025, with GMV up 19% year on year, and noted the campaign period stretching to about three weeks. (Source: [cnyes, SHOPLINE Double 11](https://hao.cnyes.com/post/208405))
- Japan (Web幹事/ユーティル survey, new projects 2022-01 to 2023-12, n=166, published 2024-07-05): average LP production order 554,000 yen, median 400,000 yen, about 70% of orders under 600,000 yen. Vendors are grouped as production companies, ad agencies, freelancers, crowdsourcing and in-house. (Source: [Web担当者Forum](https://webtan.impress.co.jp/n/2024/07/05/47298))

### Inferences
- In Taiwan the dominant merchant stacks (SHOPLINE, 91APP, marketplaces such as momo and Shopee) are closed hosted platforms. Campaign pages there are assembled by marketers or operations staff in the platform's own editor, increasingly with AI section generation built in. A React component cannot be installed into these stores, so the merchant is not a reachable buyer.
- The reachable buyers for React campaign blocks are therefore: brands on headless or custom storefronts, agencies and freelancers who hand-build LPs (the Japanese LP market at a 400,000 yen median shows clients pay for these), and developers building non-store promotional microsites.
- Platform-native AI section generation (SHOPLINE OS 3.0) is a direct substitute for purchased campaign blocks inside the platform.

### Gaps
- No source found on 91APP's campaign page tooling, on Shopee/Lazada/Tmall/JD store decoration tools, or on 618 and Lunar New Year pages specifically. My understanding that marketplace campaign pages are built in the marketplace's own decoration tools is unsourced here.
- No data on what share of LP production in Japan or Taiwan is hand-coded in React versus built in no-code tools or WordPress.
- No evidence either way of developers in Taiwan, Japan, China or Southeast Asia buying React components for seasonal campaigns. Absence of evidence after limited searching; not proof of absence.

## 6. Freelancer and agency demand

### Takeaway
I found no quantified breakdown of freelancer or agency project types. Qualitative sources describe a client base of local service businesses and SaaS companies, and agency research says specialization by industry correlates with faster growth.

### Cited Findings
- GoDaddy Pro (2025, based on interviews with "hundreds" of web designers and developers, no exact n) names typical clients qualitatively: restaurants, nonprofits, SaaS companies, real estate agents, salons, fitness coaches, sports facilities. No percentages are given. (Source: [GoDaddy research](https://www.godaddy.com/resources/ca/research/what-we-learned-from-talking-to-hundreds-of-web-designers-amp-developers))
- Promethean Research, as cited by GoDaddy (date and sample not stated): 80% of digital agencies specialize by service mix, 59% by industry, 49% by both; agencies specialized on both axes have 17% higher average client lifetime revenue and grow 40% faster than average. (Source: [GoDaddy research](https://www.godaddy.com/resources/ca/research/what-we-learned-from-talking-to-hundreds-of-web-designers-amp-developers))
- Japan: LP production is an established paid service line with a 400,000 yen median order (n=166, 2022 to 2023 projects). (Source: [Web担当者Forum](https://webtan.impress.co.jp/n/2024/07/05/47298))
- Framer creator testimonials show a path from freelance client work to template sales, with templates aimed at agency, portfolio and SaaS sites. (Source: [Framer creators](https://www.framer.com/creators))

### Inferences
- The GoDaddy client list is dominated by brochure and brand sites for service businesses plus SaaS marketing sites; online stores are not singled out. This is consistent with marketplace category structures (Framer, ThemeForest) where business, portfolio and agency categories are the broadest.
- The Promethean finding supports a niche position in principle (industry specialists grow faster), which cuts against the simple reading that a narrow e-commerce focus is a mistake. The question is whether the niche's buyers can install the product.

### Gaps
- No survey with percentages for freelancer project types (brand site, landing page, store, SaaS marketing). Upwork, Fiverr and Freelancer.com category data were not opened.
- No Asia-specific freelancer or agency project mix data.
