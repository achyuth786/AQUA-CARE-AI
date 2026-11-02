# AquaCare AI – Vannamei Shrimp Aquaculture Intelligence & Management Ecosystem

AquaCare AI is an intelligent, mobile-first precision aquaculture management ecosystem designed specifically for *Litopenaeus vannamei* shrimp farmers, farm managers, and aquaculture consultants in regions such as the Godavari and coastal belts of Andhra Pradesh. The platform unifies real-time water quality tracking, smart feed and biomass calculations, growth prediction, harvest scenario modeling, and Gemini-powered multimodal shrimp health screening with complete bilingual support in Telugu and English.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 requirements:

- **Confirmed Runtime & Backend Architecture**: Express/Node server running concurrently on port 3000 as the API gateway and dev server, routing REST API endpoints for persistent farm records, calculations, and Gemini AI processing.
- **Confirmed Language Experience**: First-class, instant bilingual switching between English and Telugu (తెలుగు) across all UI components, scientific metrics, feeding guidelines, alerts, and AI explanations.
- **Confirmed Initial Data Profile**: Preloaded with a realistic West Godavari district (Bhimavaram / Kalla coastal belt) vannamei shrimp farm, featuring two active ponds:
  - **Pond 1 (Day 48)**: Intermediate juvenile culture stage, 0.8 hectares, 80,000 seeds stocked, tracking morning/evening DO, pH, salinity, and tray feeding.
  - **Pond 2 (Day 72)**: Maturing culture stage, 1.0 hectare, 100,000 seeds stocked, approaching 60-count harvest target with biomass and FCR analytics.

***

## 1. Overview & Core Concept

- **What It Does**: AquaCare AI streamlines the entire vannamei shrimp culture lifecycle into a unified, touch-friendly productivity hub. Farmers record daily water parameters (DO, pH, salinity, alkalinity, ammonia, nitrite, transparency), log feed rations and check-tray observations, record weekly ABW (Average Body Weight) growth samples, track mortality, run what-if harvest scenarios, and upload shrimp photos for clinical visual health triage.
- **Target Audience & Persona**: Shrimp farmers in Andhra Pradesh and global tropical aquaculture belts, aquaculture farm supervisors, feed and health technicians, and lab consultants requiring fast data entry on mobile phones at the pond bank as well as comprehensive desktop analytics.
- **Key Value**: Replaces paper logbooks with automated biological calculations (FCR, Daily Feed % of Biomass, Survival Rate, Estimated Count/kg) and early risk warnings (such as nocturnal DO drops or ammonia spikes) before catastrophic shrimp mortality occurs.

***

## 2. User Experience & Visual Design

### Key User Flows
1. **Pond Overview & Farm Switcher**: The farmer lands on a high-density summary card showing pond health scores, current culture days (DOC), active biomass, and emergency alerts.
2. **Fast Pond Bank Entry**: A 2-tap entry modal allows the farmer to log morning water readings (DO, Temp, pH, Salinity) and feed trays in under 30 seconds with numeric keypads.
3. **Telugu / English Instant Toggle**: An accessible top-bar language selector instantly translates all agronomic terms (e.g. *DO / కరిగిన ఆక్సిజన్*, *Feed / దాణా*, *Biomass / జీవద్రవ్యరాశి*, *Count / కౌంట్*).
4. **Interactive Analytics & Trends**: Visual timeline charts plotting DO vs. Temperature cycles, ABW growth curves against standard Indian vannamei growth benchmarks, and feed consumption curves.
5. **Gemini Multimodal Health Scanner**: Farmers upload or snap whole shrimp, gill, hepatopancreas, or muscle photos. The AI identifies visible signs (e.g., white gut, black gill, soft shell, muscle opacity), indicates clinical uncertainty, and provides step-by-step lab verification recommendations without prescribing unverified chemicals.
6. **Harvest & What-If Financial Simulator**: Adjust target count (e.g., harvest at 60 count vs. push to 40 count), current market prices per kg, and feed cost to project net revenue and break-even thresholds.

### Visual Identity & Theme
- **Aesthetic Direction**: Professional, high-contrast, bio-marine utilitarian dashboard designed for outdoor sunlight legibility as well as dark night-shift pond monitoring.
- **Color Palette**:
  - Dominant Neutral Canvas: Dark slate `#090D16` and midnight `#0F172A` in dark mode; crisp clean `#F8FAFC` and white `#FFFFFF` in light mode.
  - Structural Surfaces: Hairline border `#1E293B` (dark) and `#E2E8F0` (light).
  - Aquatic Accents: Cyan `#06B6D4` (water metrics), Emerald `#10B981` (optimal status & growth), Amber `#F59E0B` (caution & attention), Rose `#F43F5E` (critical DO / mortality warning).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` for clean, modern legibility.
  - Body Prose: `DM Sans` with Telugu font fallbacks (`Noto Sans Telugu`, sans-serif).
  - Telemetry & Metrics: Monospace tabular numerals (`font-mono tabular-nums`) for pH, DO, Salinity, and weights to guarantee vertical alignment in grids and charts.
- **Navigation Architecture**:
  - Desktop: Persistent left sidebar ($260\text{px}$) with collapsible grouped modules (Dashboard, Ponds, Water Quality, Feed & Biomass, Growth & Sampling, Health Scanner, Harvest & Market, Knowledge Hub).
  - Mobile: Ergonomic bottom navigation bar with thumb-friendly quick-add FAB (Floating Action Button) for instant pond parameter recording.

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full Bilingual Translation Architecture (Telugu & English)**
  - *Chosen Approach*: A dedicated dictionary-driven translation engine (`/src/i18n/`) with instant reactive context switching.
  - *Why*: Shrimp farmers in Andhra Pradesh predominantly operate in Telugu, while technical consultants and export buyers use English. Complete parity prevents communication breakdown.
- **Decision 2: Scientific Aquaculture Agronomy Engine**
  - *Chosen Approach*: Client-side and server-side validated formulas for:
    - Estimated Biomass: $\text{Current Population} \times \frac{\text{ABW (g)}}{1000}$
    - Feed % of Biomass: Variable sliding scale ($2.5\%$ to $4.5\%$ based on ABW stage and water temperature).
    - Feed Conversion Ratio (FCR): $\frac{\text{Cumulative Feed (kg)}}{\text{Total Biomass Gain (kg)}}$.
    - Health Index (0-100): Weighted score across DO stability, pH delta, ammonia levels, and feed consumption rate.
  - *Why*: Eliminates arbitrary guesswork and ensures scientific rigor.
- **Decision 3: Responsible Multimodal AI Health Screening**
  - *Chosen Approach*: Gemini 3.8 Flash multimodal integration via server-side API (`/api/gemini/screen-shrimp`). Adheres strictly to scientific safety rules: clearly communicates that visual triage does not replace PCR laboratory pathogen tests, highlights observable lesions (gill fouling, hepatopancreas shrinkage, white gut), and provides observation checklists.
- **Decision 4: Responsive Dark & Light Dual-Theme Engine**
  - *Chosen Approach*: Tailwind CSS v4 `@custom-variant dark` support with smooth transition, adhering to zero-pill and single-elevation card discipline.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AquaCare AI Client (React 19)                   │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar Contract: Brand · Language Switcher (EN/TE) · Theme · Profile │
│  Responsive Layout: Desktop Sidebar (260px) / Mobile Bottom Nav Bar   │
│                                                                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Farm & Pond Hub  │ │ Water Analytics  │ │ Feed & Biomass Tracker │  │
│  │ (DOC, Stocking)  │ │ (DO, pH, Salin)  │ │ (Trays, FCR, Ration)   │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ AI Health Scan   │ │ Harvest & Price  │ │ Telugu Farmer Voice &  │  │
│  │ (Gemini 3.8 Fl)  │ │ Simulator (What-If│ │ Assistant Chat       │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API & Server Endpoints
┌───────────────────────────────────▼────────────────────────────────────┐
│                    AquaCare Backend (server.ts / Vite)                 │
├────────────────────────────────────────────────────────────────────────┤
│  - REST API Routes:                                                    │
│    * /api/farms & /api/ponds (CRUD, cycle state, pond metrics)         │
│    * /api/water-quality (daily AM/PM logs, range evaluation)           │
│    * /api/feed-records (tray checks, daily rations, cumulative kg)     │
│    * /api/sampling (ABW, count/kg, survival estimate)                  │
│    * /api/gemini/screen-shrimp (Multimodal health triage)              │
│    * /api/gemini/chat (Bilingual Telugu/English farming advice)        │
│    * /api/market-prices (Count-wise Andhra market price records)       │
│  - Storage Engine: In-memory & JSON file persistence with schemas      │
│  - @google/genai SDK: gemini-3.8-flash with server-side API key guard │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Entities
- **Farm & Pond**: `id`, `name`, `location` (e.g. Bhimavaram, AP), `area_ha`, `depth_m`, `aerator_hp`, `status`.
- **Culture Cycle**: `id`, `pond_id`, `stocking_date`, `seed_count`, `initial_abw_g`, `density_per_sqm`, `status`.
- **Water Record**: `id`, `pond_id`, `timestamp`, `session` (AM/PM), `do_ppm`, `ph`, `salinity_ppt`, `temp_c`, `alkalinity_ppm`, `ammonia_ppm`, `nitrite_ppm`, `transparency_cm`.
- **Feed Record**: `id`, `pond_id`, `date`, `ration_kg`, `protein_pct`, `tray_1_status`, `tray_2_status`, `tray_3_status`, `daily_total_kg`.
- **Shrimp Sample**: `id`, `pond_id`, `date`, `abw_g`, `count_per_kg`, `sample_size`, `growth_rate_g_day`.
- **Health Scan**: `id`, `pond_id`, `date`, `image_url`, `focal_area`, `visible_signs`, `possible_risks`, `urgency`, `laboratory_action`.
- **Market Price**: `id`, `date`, `count_per_kg`, `price_inr_per_kg`.

***

## 5. Phased Build Sequence

- **Step 1: Core Foundation & Bilingual Engine**
  - Set up Express backend server with modular routes and mock repository loaded with West Godavari pond data.
  - Build Telugu and English translation dictionary (`/src/i18n/translations.ts`) and bilingual context hook.
  - Configure Tailwind v4 `@custom-variant dark` styling and layout shell.
- **Step 2: Responsive Shell & Main Dashboard**
  - Implement top navigation bar, collapsible desktop sidebar, and mobile bottom navigation.
  - Build primary dashboard metrics: Total Ponds, Active Culture Days, Average Biomass, Overall Health Score, and Active Water Alerts.
- **Step 3: Farm & Pond Management Modules**
  - Pond profile cards, pond switcher, and culture cycle details.
  - Interactive fast data logging modal for water quality and daily feed.
- **Step 4: Water Quality & Feeding Intelligence**
  - Morning vs Evening parameter monitoring with safe/caution/danger status bands.
  - Feed tray monitoring (Tray 1-4 observations: clean, 20% left, full) and biomass feed calculator.
- **Step 5: Growth Analytics & What-If Harvest Simulator**
  - ABW growth tracker, count progression curves, and FCR analytics.
  - What-if simulator comparing 80 count, 60 count, 50 count, and 40 count harvest economics.
- **Step 6: Gemini Multimodal Shrimp Health Scanner & AI Assistant**
  - Multimodal image upload with sample reference photos (healthy vannamei, black gill symptom, white gut symptom).
  - Gemini 3.8 Flash backend integration analyzing visible lesions with scientific uncertainty guidelines.
  - Conversational Telugu/English chat assistant for instant pond guidance.
