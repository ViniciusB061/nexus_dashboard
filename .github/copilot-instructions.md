<!-- Copilot / AI agent instructions for quick onboarding -->
# Copilot instructions — Nexus dashboard

Purpose: Help AI coding agents be immediately productive modifying the small frontend dashboard and its import script.

- **Big picture**: This is a static frontend dashboard (`index.html`, `ATUALIZAÇÃO.JS`, `ATUALIZAÇÃO.CSS`) that displays contract KPIs and a Chart.js doughnut. Data is produced/updated by an import script (`ATUALIZAÇÃO.PY`) which maps Excel/raw statuses into the dashboard statuses and writes to a Postgres DB.

- **Key files**:
  - `index.html`: DOM structure, inline `onclick` hooks and canvas `meuGrafico`.
  - `ATUALIZAÇÃO.JS`: primary UI logic — theme toggle, `contratos` seed data, `renderDashboard()`, `renderChart()`, and global functions exposed on `window` (`alternarTema`, `renderDashboard`, `openEditModal`, `closeModal`, `saveManualChange`, `simularImportacao`). Use this file for UI behavior changes.
  - `ATUALIZAÇÃO.PY`: ETL/import helper. Contains `DE_PARA_STATUS` mapping and DB upsert logic (uses SQLAlchemy). Update DB connection string here.
  - `ATUALIZAÇÃO.CSS`: visual theming and CSS variables referenced from JS (color names like `--success-color`).

- **Important patterns & conventions**:
  - HTML uses inline `onclick="..."` that calls functions defined as `window.foo = function(){}` in `ATUALIZAÇÃO.JS`. If you add a new onclick in HTML, expose a matching `window.` function in the JS file.
  - Status values are authoritative and must match across files. Canonical statuses: `Digitação`, `Formalização`, `Andamento`, `Pago Cliente`, `Pendência`, `Cancelado`. Changes must be updated in both `ATUALIZAÇÃO.JS` (UI mapping and `colorMap`) and `ATUALIZAÇÃO.PY` (`DE_PARA_STATUS`).
  - Chart.js is loaded from CDN in `index.html`; the JS file registers `ChartDataLabels` manually. When modifying chart behavior, update `backgroundColors` and datalabels formatter inside `renderChart()`.
  - Theme toggling relies on `body.classList.toggle('dark')` and localStorage key `theme`. After theme change, `renderDashboard()` is called to refresh chart color/labels.

- **Developer workflows (discoverable from repo)**:
  - Frontend dev: open `index.html` in a browser (no build system). Edit `ATUALIZAÇÃO.JS`/`ATUALIZAÇÃO.CSS` and reload.
  - Simulate incoming data quickly: click the `Atualizar` button (calls `simularImportacao()`), or run/modify `ATUALIZAÇÃO.PY` to import real Excel files into Postgres.
  - Python/DB: set the SQLAlchemy connection string in `ATUALIZAÇÃO.PY` before running. The script uses an `ON CONFLICT` upsert with a guard `travar_automacao = FALSE` to avoid overwriting locked rows — preserve that WHERE clause unless you intend to change locking semantics.

- **Integration points & external deps**:
  - Chart.js and `chartjs-plugin-datalabels` are CDN dependencies (see `<script>` tags in `index.html`).
  - Postgres via SQLAlchemy in `ATUALIZAÇÃO.PY` (install `sqlalchemy` and `psycopg2` if running the script).

- **Examples / actionable edits**:
  - To add a new status `Em Revisão`:
    1. Add it to `DE_PARA_STATUS` in `ATUALIZAÇÃO.PY` mapping incoming labels → `Em Revisão`.
    2. Add color mapping in `ATUALIZAÇÃO.JS` `colorMap` and include a background color entry in `renderChart()` `backgroundColors` array in the same order as the `stats` keys.
    3. Ensure any UI placement (cards, legends) uses the exact status string.

  - To change DB behavior: edit connection in `ATUALIZAÇÃO.PY` and preserve the `ON CONFLICT ... WHERE nexus_portabilidade.travar_automacao = FALSE` guard unless you intentionally change lock rules.

- **What NOT to change lightly**:
  - Changing status names without updating both frontend and import mapping will break visuals and KPI aggregation.
  - Removing the `window.` exposure for functions referenced by HTML will break onclick handlers.

If something above is unclear or you want more examples (tests, CI, or sample Excel columns), tell me which area to expand and I'll iterate.
