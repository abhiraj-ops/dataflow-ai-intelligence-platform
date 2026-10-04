<div align="center">

<img src="public/pulse.svg" alt="DataFlow pulse" width="72" />

[![CI](https://github.com/abhiraj-ops/dataflow-ai-intelligence-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/abhiraj-ops/dataflow-ai-intelligence-platform/actions/workflows/ci.yml)
![Last commit](https://img.shields.io/github/last-commit/abhiraj-ops/dataflow-ai-intelligence-platform?style=flat-square&logo=github)
![Version](https://img.shields.io/github/package-json/v/abhiraj-ops/dataflow-ai-intelligence-platform?style=flat-square&logo=npm)
![Repo size](https://img.shields.io/github/repo-size/abhiraj-ops/dataflow-ai-intelligence-platform?style=flat-square)
![License](https://img.shields.io/github/license/abhiraj-ops/dataflow-ai-intelligence-platform?style=flat-square)

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Space+Mono&size=22&pause=1000&center=true&vCenter=true&width=700&lines=Ask+your+sales+data+anything.;120+weeks.+8+metros.+All+values+in+%E2%82%B9.;Anomalies%2C+forecasts+%26+drivers+in+plain+English.)](https://git.io/typing-svg)

**AI-Powered Data Intelligence Platform** — conversational analytics, real-time visualization and predictive modeling.



</div>

---

## 📖 What is this?

Upload a sales CSV, ask questions in plain English, and get charts, anomaly flags and demand forecasts back — no dashboards to build. Zero external APIs: everything runs locally on mocks.

**Bundled data story** — `india_d2c_weekly_sales.csv`: 120 weeks of grocery sales across **8 Indian metros** (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad), all values in **₹** with Indian digit grouping (`₹42,50,000`) and Cr/L abbreviations. Real-feeling seasonality (Diwali surge, wedding-season lift, monsoon lull) plus genuine demand shocks for the anomaly detector to find.

## ✨ Features

| Module | What it does |
|---|---|
| 📊 Intelligence dashboard | Data-driven INR KPIs (lifetime revenue, units, metros, conversion) + live status |
| 📥 Ingestion hub | Drag-drop CSV, JSON/JSONL, Excel, images (mock OCR), DB connectors · preview + validation badges |
| 🔍 Data explorer | Sortable/filterable grid, 4 configurable charts (bar, line, scatter, heatmap), stats + correlation matrix |
| 💬 AI chat analyst | Top-10s, trends, outliers, drivers — with confidence scores, embedded charts/tables, follow-ups |
| 🔮 Predictive analytics | 2σ anomaly detection, OLS forecasts (7/14/30-day) with confidence bands, feature ranking, seasonality |
| 🔗 Pipeline builder | Visual source → transform → enrich → analyze → export flow with per-step preview |
| 🧹 Data preparation | Regex find/replace, null strategies, outlier treatment, normalization, dedupe |
| 📤 Sharing & export | HTML reports, CSV/JSON/SQL/API-cURL exports |
| ⚙️ Settings | API keys, retention, notifications, theme, shortcuts |

## 🏗️ How it flows

```mermaid
flowchart LR
    A[CSV / JSON / Excel / DB] --> B[Ingestion + validation]
    B --> C[Explorer: grid + charts + stats]
    C --> D[AI chat analyst]
    C --> E[Anomaly detection + forecasting]
    D --> F[Pipeline + preparation]
    E --> F --> G[Reports + exports]
```

## 🛠️ Tech stack

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-000000?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-3-FF6384?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

<details>
<summary><b>📁 Project structure</b></summary>

```
src/
├── components/   # Header, DataIngestion, DataExplorer, ChatInterface,
│                 # Analytics, Pipeline, Prepare, ExportPanel, Settings, Footer
├── data/         # mockDataset.ts — 120-week Indian D2C generator (seeded)
├── store/        # useStore.ts — Zustand state (rows, chat, charts, pipeline)
├── utils/        # dataProcessing, aiResponses, exportHelpers (+ tests)
├── types/        # DataRow, ChatMessage, ChartConfig, PipelineStep …
└── styles        # index.css — glassmorphism + neon system
```

</details>

<details>
<summary><b>⚡ Scripts</b></summary>

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run type-check` | `tsc` |
| `npm run lint` | ESLint (zero-warning) |
| `npm test -- --run` | Vitest suite |

Node ≥ 20 required. Deploy configs included: `vercel.json` + `netlify.toml`.

</details>

## 📊 Repo stats

<div align="center">

![Stats](https://github-readme-stats.vercel.app/api?username=abhiraj-ops&show_icons=true&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=00D9FF&icon_color=D946EF)
![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=abhiraj-ops&layout=compact&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=00D9FF)

</div>

## 📄 License

MIT © 2026 DataFlow Analytics · Bengaluru, India
