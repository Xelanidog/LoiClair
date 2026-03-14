## Week of March 9, 2026

### Added
- **Bilingual French/English interface** — the entire interface is now available in English thanks to an FR/EN toggle in the sidebar. The language preference is saved in a cookie
- **AI summaries in English** — law summaries can be generated in English, with a separate cache for each language
- **Translation of guide and methodology** — documentation pages are available in English
- **Localized 404 and error pages** — error pages display in the chosen language, with a link to report a bug
- **New "Applied" status** — enacted laws for which all implementing decrees have been published (or are directly applicable) are now identified by the "Applied" status, with a badge and a golden bullet
- **"Applied" filter** — a new status filter allows you to isolate fully applied laws in the dossier list
- **AI card with glowing border** — the summary is presented in a card with a gradient golden border that pulses gently
- **"Discuss this text with AI" link** — an animated golden link at the bottom of the card lets you open an in-depth discussion about the text via Perplexity, with legislative context pre-filled
- **"Key takeaway" callout** — the key sentence from each summary is highlighted in a colored callout at the bottom of the summary
- **Teal badges on changes** — each point in the "What's changing" section is accompanied by a check icon on a teal background
- **"At a glance" section** — a 2-3 sentence summary visible immediately at the top of the page, before detailed sections
- **Text selector at the top of the page** — a dropdown menu allows you to choose which text to summarize directly below the title, with texts grouped by legislative stage and sorted by date
- **"AI summary" label** — a ✨ icon and label clearly identify the section as AI-generated content
- **Accordions in the timeline** — each stage with associated texts can be expanded to see and select available texts
- **"About this law" section** — dossier metadata (status, procedure, author with role, official sources) are grouped in a dedicated section
- **Title banner on the AI summary page** — a banner with subtle gradient now frames the dossier title for better readability
- **Durations integrated in the timeline** — the total duration of the legislative journey ("Enacted in X days") and the application duration ("Applied in X days") display directly under the corresponding stages
- **Special icons** — the Enacted stage displays a ✓ icon and the Application stage displays a flag to distinguish them visually
- **Application date** — for laws requiring decrees, the Application stage displays the date of the last decree published
- **Direct application** — laws with direct application display "Enacted (direct application)" with "Enacted and applied in X days" as a single final stage
- **Vertical timeline on the AI summary page** — a dossier's legislative journey is now displayed as a vertical timeline with the date of each stage, the duration between consecutive stages, and an animated dot on the current stage
- **Post-enactment stages** — after enactment, the timeline displays implementing decrees and the law's application status
- **Next stage pending** — the timeline displays the next expected stage (other chamber or enactment) with a dotted line
- **"Joint committee text" prefix in the news feed** — joint committee debate decisions now display "Joint committee text · " before the institution name
- **"Ongoing for X days"** — the current stage in the timeline now displays how long it has been active, in orange
- **Decree publication duration** — the "Implementing decrees" stage displays how long it took to publish all decrees, or "ongoing for X days" if not all have been published yet
- **Filters in a panel on mobile** — on the legislative dossiers page, filters are grouped in a panel that opens from a "Filters" button, for smoother navigation on phones
- Multi-selection of filters by card type in the news feed — you can now combine multiple filters at once
- Application indicators for laws in the KPIs — new funnel and charts showing how many implementing decrees have been issued for each law
- Tracking of law implementation in the news feed — implementing decree cards appear in the stream
- Implementing decree cards in the news feed with redesigned enactment cards
- Infinite scroll on the news feed — no more need to navigate between months, content loads on scroll
- Automatic import of implementing decree content from Légifrance
- Chronological sorting, decree naming, and consolidated version dates in AI summaries
- "Release notes" page accessible from the footer — complete history of site updates, organized by week with collapsible sections
- **Unified navigation** — a single horizontal menu at the top of all pages replaces the old fixed sidebar + separate header. Categories (News feed, Dashboard, Bodies, Documentation, About) are centered with the logo
- **Contextual sidebar** — a minimal sidebar (text only, no icons) appears only on pages with sub-categories (KPIs, Composition, Documentation…)
- **Redesigned mobile menu** — a burger button opens a panel with accordion categories and their sub-links
- **"Contribute" button** — a GitHub pill in the menu invites users to report bugs or suggest improvements
- **Light/dark toggle** — a sun/moon button in the menu switches themes with a smooth transition (View Transitions API)
- **AI summaries open in new tab** — clicking on an AI summary opens the page in a new browser tab
- **Enriched footer** — footer with columns organized by category (Explore, Resources, Legal, Contact)
- **Redesigned changelog page** — release notes now use a clean style with colored pills (green = added, blue = changed, yellow = fixed, gray = removed) and are integrated into the Documentation sidebar

### Changed
- **"Idea? Problem?" button in navigation** — the feedback/idea button moves from the bottom-right corner to the top navigation bar (pill on desktop, item in burger menu on mobile). The "Contribute" (GitHub) button moves to the footer
- **Dossier list — fully clickable cards** — each dossier in the list is now a clickable link across its entire surface, with an "AI Summary →" label that appears on hover (left accent border + colored background)
- **AI summary page — golden border** — the AI summary card is framed with a fine gradient golden border with a glow that pulses gently
- **Localized monthly chart** — the title, description, and trends of the monthly activity chart adapt to the language
- **Localized search and filters** — the search placeholder, filter labels, and pagination display in the chosen language
- **Localized legislative funnel** — the legislative journey in the key indicators displays in the active language
- **Bilingual release notes** — the release notes page displays in French or English based on the selected language
- **Language toggle aligned to the left** — the FR/EN selector is aligned to the left in the sidebar for better visual alignment
- **Harmonized status colors** — each status now has a distinct color: gold for "Applied", green for "Enacted", unified purple for all "Adopted", red for "Rejected", orange for "In progress"
- **Applied laws counted in indicators** — "Applied" laws are correctly counted as both enacted and applied in the dashboard
- **"About this law" section restructured** — metadata are now displayed in a structured grid with aligned labels, more readable than before
- **"Official text" link** — the link to the text on Légifrance was renamed from "Read the text" to "Official text" for clarity
- **Summary text label truncated on mobile** — the text name is shortened with ellipsis when the screen is too small
- **AI card footer always aligned to the left** — the footer aligns naturally to the left when its content spans multiple lines
- **New AI prompt — 3 conversational sections** — the summary shifts from 4 technical sections to 3 everyday language sections: "What this text says", "What actually changes" and "Key takeaway"
- **Text selector integrated in card footer** — the selector is now directly in the AI card footer instead of a separate section at the top of the page
- **Card always accessible** — even on an invalid text or consolidated version, the card remains visible and the "Change" button is always accessible
- **New page organization** — the AI summary is now at the top (visible without scrolling), followed by metadata, then the law's journey
- **Generation indicator** — the "Generating…" message displays next to the "AI summary" title instead of occupying a separate line
- **Source in the selector** — each text indicates its origin stage (National Assembly, Senate, Joint committee…) in the dropdown menu
- **Faster AI summary page load** — voting data is now retrieved in a single request instead of two
- **Reorganized internal code** — the timeline and voting results are now independent components
- **Timeline in continuous column** — the vertical line connecting stages is now uninterrupted
- **Non-enactable resolutions and texts** — resolutions and information reports no longer display "Enacted" as the next stage
- **Simplified indicators** — duration badges by chamber are removed since this information is now readable in the timeline
- **Durations on connection lines** — durations between stages are displayed on the line connecting two stages, to avoid any ambiguity
- **Uniform spacing** — all timeline stages now have the same vertical spacing
- **General mobile optimization** — reduced top spacing on pages, adjusted side margins, better space usage on small screens
- **More compact landing page on mobile** — the hero and sections take up less vertical space
- Filters (status, dates, types, groups, themes) display at full width on mobile for better readability
- The "Report" button becomes **"Have an idea? Found a problem?"** — it now allows you to suggest feature ideas in addition to reporting bugs
- The modal opens with a choice screen between "Report a problem" and "Suggest an idea", with a form adapted to each case
- The "Week Feed" has been renamed "News Feed" everywhere on the site for clarity
- **Smaller page titles** — H1 titles on all pages are more compact to harmonize with the new navigation
- **More space before footer** — a comfortable margin separates content from the footer
- **Subtle warm background** — page content regains its subtle warm tint that distinguishes it from the navigation bar
- **Compact legislative funnel** — the legislative journey is now displayed as a compact vertical stepper: colored numbers + labels + conversion rates, without horizontal bars — much more readable and compact
- **Redesigned filters on the dossiers page** — the search bar spans the full width, filters are grouped in a side panel (right on desktop, bottom on mobile) accessible via a "Filters" button with a counter badge. Active filters appear as removable chips
- **"Text types" page reorganized** — the page is now divided into two sections (parliamentary texts / government texts) with a lightweight card grid design, and three new types added: Amendment, Ordinance and Decree

### Fixed
- **"Toolbox" cards disappeared** — feature cards on the landing page now remain visible after a language change
- **Broken AI summary** — the data request failed because a column didn't exist in the database yet; fixed by adding the column and updating the code
- **Duplicate label fixed** — the text name is no longer repeated when it matches the stage name
- **Stage order** — Constitutional Council and Joint committee now display in the correct chronological position
- **Incorrect dates filtered** — decrees with dates prior to dossier filing are excluded from the timeline
- **Application status** — when a law is 100% applied, the "Application" stage is correctly marked as complete in the timeline
- **Filters on Safari** — the mobile filter panel no longer displays correctly on Safari. Fixed so inline filters display on desktop and panel only on mobile
- **Mobile keyboard on filters** — the virtual keyboard no longer opens automatically when the mobile filter panel opens (Safari)
- **Consistent "LoiClair" logo** — the size and link of the logo at the top left are now identical across all pages
- News feed order on dossier pages now displays recent events first
- Removed flickering when streaming AI summaries (two successive fixes for hidden and non-hidden cases)
- Fixed pipeline to catch enriched laws without text links
- **News feed cut off on mobile** — news feed content was overflowing left and right on small screens due to negative margins
- **Dossier titles squished on mobile** — the hidden "AI summary" side panel was compressing titles on some mobile browsers
- **AI summary flickering during streaming** — the summary text was flickering and overlapping during live generation, caused by a duplicate API call in development mode. Added throttle for smoother display
- **Markdown formatting in AI summaries** — bold, italic and other AI-generated formatting now renders correctly instead of showing raw characters (e.g. `**text**`)
- **"Got an idea? A problem?" button cut off on mobile** — the text and icon of the feedback button in the mobile menu were misaligned and the text overflowed onto two lines

### Removed
- The old "LoiClair Dossier with AI summary" button (cyan pill badge) has been replaced by the clickable card
- **Status and procedure badges** — replaced by lines in the metadata grid for more uniform reading
- **Mobile accordion / desktop grid** — replaced by a single, fluid, vertical display on all screens
- **Separate "Text selector" section** — integrated into the AI card footer
- **Old dropdown menu** — the old confusing text selector (dropdown) has been replaced by the new selector grouped by stage
- **Separate KPI badges** — duration indicators are now integrated directly into the timeline
- **Old fixed sidebar** — replaced by the unified horizontal navigation and contextual sidebar
- **Separate mobile menu** — replaced by the burger integrated into the TopNav

---

## Week of March 3, 2026

### Added
- Enrichment of legislative data via the Légifrance API — laws and consolidated versions
- Import of law implementation tracking from the National Assembly's monitoring dashboard
- 1-hour cache and loading skeletons on Dossiers, KPIs, News Feed and Composition pages
- Dedicated error pages in case of Supabase outage (instead of blank pages)
- Animated SVG wave with two layers moving in opposite directions on the landing page
- Supabase cache for AI summaries — already-generated summaries load instantly
- News feed section with mockup on the landing page
- Citizen reporting system — "Report a problem" button on each page
- Automatic email notification via GitHub Actions for each report received
- Weekly email summary of reports from the week
- Adoption of GNU AGPL v3 license
- Complete README rewrite with architecture, stack, installation and sources
- Search for parliamentarians in the KPIs — search bar to quickly find a deputy or senator
- Ranking of most active parliamentarians with chamber badge (National Assembly/Senate)
- Chronological KPIs and external links on dossier AI summary pages
- Activity charts by political group in the KPIs with "how is this calculated" links
- Role prefix for authors in the news feed (deputy, senator, etc.)
- Redesign of legislative shuttle cards in the news feed with current duration display
- Redesign of report and joint committee report cards with rapporteurs displayed
- Redesign of decision cards — ballot title, vote type and required majority
- Improved Constitutional Council referral card
- Law number displayed on enactment cards
- Last update badge and hero button redesign on the landing page
- Alerts and newsletter on the homepage, 4-column feature grid
- Text publication indicator (stored in database instead of live verification)
- Sending direction → receiving direction displayed on legislative shuttle cards between chambers

### Changed
- Redesign of landing page sections with clickable mockups and enriched About section
- Complete landing page redesign with new teal/gold palette
- Hero CTA renamed to "Parliamentary news feed"
- KPI page title renamed to "Key indicators"
- Visual redesign of the sidebar with icons and collapsible accordions
- More compact dossier list with qualified author and timeout on AI summary
- Centralization of status badges and correction of double filtering
- Improved visibility of alerts when a text is unavailable
- Improved contribution buttons and site footer
- About page completed with technical stack, data sources, Légifrance and National Assembly monitoring dashboard
- Removal of individual participation averages from the Composition page

### Fixed
- Fixed hero-2 section in dark mode via CSS variables
- Disabled Turbopack cache and fixed layout shift in AI summary
- Fixed pipeline to stop overwriting data enriched from Légifrance
- News feed card titles forced to start on a new line
- Removed a console.log that exposed the site password
- Fixed TypeScript error on login cookies
- Fixed sticky footer layout
- Removed .claude/ folder from repository and added to .gitignore
- Improved duration badge readability on dossiers and fixed 0-day calculation
- Fixed timeline order in AI summaries
- Fixed "Report" label for CMP_RAPPORT
- Fixed source of DECISION badge and cleaned vote_refs in Python script
- Fixed display of censure motions and author parsing
- Removed an orphan comparison that blocked TypeScript build

---

## Week of February 24, 2026

### Added
- Individual participation and cohesion record KPIs on the Composition page
- Hemicycle mobilization indicators during votes (global attendance rate)
- Links to methodology under individual record KPIs
- Exclusion of institutional non-voters from participation calculation (presiding officer, etc.)
- Monthly news feed — new page showing all legislative activity of the month (filings, shuttles, votes, enactments, referrals, etc.)
- Link to dossier timeline from the AI summary
- News feed integrated on the landing page with redirect button
- Enlarged hover animation on card footer icons

### Changed
- Complete audit and refactoring of import scripts (actors, organs, legislative acts) — removal of dead code, addition of retries
- Transformation of weekly feed into monthly feed for a more complete view
- Unified filter pills replacing old KPI pills and filter bar
- Harmonization of titles, padding and containers across all pages
- Centralization of news feed labels and removal of duplicated code
- Simplification of censure motion cards
- Query optimization and improved decision card presentation
- Text link verification added to import script with database storage

### Fixed
- Deputy participation calculation adjusted to effective term period
- Multi-period calculation for deputies who were ministers and returned to the National Assembly
- Rename "absent" to "non-participants" to clarify the distinction
- Correct display of enactments, Constitutional Council referrals and government declarations
- Fixed padding offset when sidebar disappears in responsive mode
- Fixed display of votes linked to acts without associated text
- Fixed display of legislative acts in the month feed
- Fixed TAP links with PDF fallback for legislative proposals
- Added string types to forEach callbacks that blocked deployment

---

## Week of February 17, 2026

### Added
- Complete documentation section accessible from the sidebar — user guide, methodology, glossary
- AI compliance page (AI Act) with transparency on artificial intelligence use
- Dossier metadata (author, type of procedure, status) and progress bar on the AI summary page
- Tooltips explaining types of legislative procedure
- Text count and UID displayed in dossier cards
- Advanced KPIs — average processing times by chamber, enactment rate, success rate by political group
- Keyword search on the legislative dossiers page
- Complete redesign of dossier cards with dynamic legislative progress bar
- Selection combobox in AI summaries (replaces old table) with summary structured in 3 sections
- Data enrichment via Légifrance API (laws and consolidated versions)
- Badge on the login page
- Vote statistics in the Composition page
- Member table in the Composition page with column sorting
- Login system with site-wide password protection
- Interactive charts (National Assembly and Senate) with animated figures in the Composition page
- Navigation tabs National Assembly/Senate/Government in the Composition page
- Senate composition chart
- Creation of Composition page for institutions
- Complete KPIs page for legislative dossiers with filtering
- Filter by political group on the dossiers page and in the KPIs
- Primary color in orange for dark mode

### Changed
- Methodology completely rewritten with complete glossary definitions and bidirectional links KPIs ↔ methodology
- Restructuring of stats table by group with sections by chamber in the KPIs
- Optimized mobile navigation
- "AI summary" button highlighted with shimmer animation compatible with all browsers
- Increased mobile padding-top to avoid overlap with navigation bar
- Use of filing date instead of legislative act date on the dossiers page
- Improved timezone management in dates
- General refactoring and project structure optimization
- Improved filter interface
- Import dossiers before texts, batch of 500 for texts script
- Distinction between active deputies, senators and ministers in import script
- Improved visual distinction between valid and invalid links
- Improved performance of dossier import script
- Redesigned introduction page with primary color

### Fixed
- Fixed anchor links to methodology by adding rehype-slug
- Made Composition page responsive for mobile
- Normalized profession label format in import script
- Fallback to text author when dossier initiator is absent
- Fixed "Rejected" status for single-chamber procedures
- Fixed display of undefined adoption statuses in AI summary combobox
- Fixed chart sizes

---

## Week of February 10, 2026

### Added
- Dynamic filter by text type on the dossiers page
- Dynamic filter by active political group
- Filter reset button
- AI summary opens in a new tab
- Streaming AI summary — text appears progressively
- Automatic import script for legislative dossiers from open data URL
- Text import script from cloud storage
- Combined import script for actors and organs with batch upload
- Legislative acts import via open data URL with duplicate handling
- Setup of GitHub Actions for automatic daily import
- Hover effect on dossier page filters
- Status filter on the dossiers page
- Age filter on texts
- Enactment date handling on the main page
- Import of enacted texts with enactment date
- Filing date imported in dossiers table
- Filters for adoption and rejection statuses

### Changed
- Removal of chronological summary (replaced by AI summary)
- Improved age filter via database query
- Enhanced status: use of latest decision by date per chamber
- Improved dossier upload performance
- Optimized legislative acts import in batch of 1000
- Fixed indentation of Python scripts with Black
- Improved final script report with deduplication

### Fixed
- Resolved PDF parsing error
- Filters are now correctly cumulative (instead of replacing each other)
- Reset button now returns to page 1
- Filters return to page 1 when changed, but keep page when paginating
- Fixed display of dossiers without authors
- Removed group filter that wasn't working correctly

---

## Week of February 3, 2026

### Added
- Construction of main page based on Supabase data (replacement of static page)
- Dossier metadata retrieved from Supabase
- Text table on the AI summary page
- Complete AI summary integration (sending text to Grok, displaying result)
- Functional PDF parsing to extract law text before sending to AI
- Title displayed at the top of the AI summary
- Valid links to official texts

### Changed
- Improved text import scripts
- Package updates
- Improved AI summary API route
- Improved user experience on the main page
- General improvement of Python import scripts

---

## Week of January 27, 2026

### Added
- Import script for the actors table (deputies, senators, ministers)
- Import script for organs (political groups, committees, etc.)
- Import script for votes and ballots
- Import script for legislative dossiers

### Changed
- Improved Python script for senatorial reports
- Text script now generates 100% of links to official texts

---

## Week of January 20, 2026

### Added
- Initial LoiClair project structure with parsing scripts and documentation
- Externalization of AI parameters in a dedicated prompts file
- Pagination system on the legislative dossiers list
- Law summary and timeline with improved AI prompts and markdown rendering
- "Discuss with AI" button to ask questions about a law
- Loading skeleton while waiting for data
- KPIs page with first key indicators
- Python script to send texts to Supabase with extraction of authors and rapporteurs

### Changed
- Improved sidebar panel and graphical interface
- Reset button refactoring
- Improved import script (handling volumes, iterations)

---

## Week of January 10, 2026

### Added
- Project creation — Next.js initialization
