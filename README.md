# ⚽ FIFA World Cup 2026 Interactive Web Application

A premium, interactive React/TypeScript web application designed for the **FIFA World Cup 2026**. This application features a comprehensive tournament tracker, a customizable fan hub, statistical simulations, and historical matching engines.

---

## 🌟 Key Features

### 1. 👤 Personalized Fan Hub ("My Team")
- **Onboarding Selector**: Search, filter by confederation, and select a favorite national team. Choices are stored locally (`localStorage`) for a personalized experience.
- **Dynamic Widgets**: Get quick access to upcoming fixtures, team news, squads, and tactical lineups.
- **Pitch Formation Lineup Visualizer**: Renders active squads on a responsive soccer pitch grid. Player names are normalized (ignoring diacritics/accents) to fetch proper jersey numbers and stats.
- **Dynamic Star Analytics**: Computes real-time goals and assists for star players directly from completed matches, replacing static mocked data.

### 2. 🤖 Group & Knockout Match Simulator
- **104-Match Simulator**: Simulates every group stage and knockout game with fine-tuned automatic or manual pacing.
- **Vite Server POST Endpoint & Results Logging**: Saves each full simulation sequence to `simulation_results/sim_X.json` files on a local server.
- **Statistical Aggregator Engine**: Periodically compiles all logged simulations to generate statistical prediction percentages stored in [prediction_percentages.json](file:///c:/Users/DELL/OneDrive/Desktop/worldcup-2026/src/data/prediction_percentages.json):
  - **Match Win/Draw/Loss Rates**: Calculates head-to-head records across all pairing permutations.
  - **Progression Probabilities**: Evaluates how far each team advances (R32, R16, QF, SF, Finals, Champion).

### 3. 📊 Tournament Center & Standings
- **Group Standings**: Track live-updated table points, goal differences, and head-to-heads.
- **Knockout Bracket**: Responsive visual tree tracking advancing teams from the Round of 32 to the Finals.
- **Detailed Match Pages**: View score lines, goalscorers, cards, assists, own goals, penalties, and Player of the Match awards.
- **Data Synchronization**: Resolves spelling variations (e.g., mapping `"Turkey"` to ID `"turkiye"`) dynamically to avoid broken asset routes or missing flags.

### 4. ⏳ Historical Match Simulator
- **Retro Matches**: Re-simulate past World Cup matchups using historical squad profiles and historical team strengths.

### 5. 🛠️ Admin Management Portal
- Adjust game structures, configure live data feeds, update player rosters, and review system configuration.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (smooth transitions and micro-animations)
- **Data Visualizations**: [Recharts](https://recharts.org/) (interactive charts and prediction diagrams)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons & Flags**: [Lucide React](https://lucide.dev/) + [country-flag-icons](https://github.com/catamphetamine/country-flag-icons)

---

## 📁 Directory Structure

```text
worldcup-2026/
├── src/
│   ├── components/       # Modular UI blocks (home, match, simulator, team, ui)
│   ├── data/             # JSON databases for squads, lineups, and results
│   ├── hooks/            # Custom React hooks (e.g., useSimulator)
│   ├── lib/              # Database or utility clients (e.g., Supabase)
│   ├── pages/            # Page-level components (Home, Standings, Admin, etc.)
│   ├── store/            # State management configurations
│   ├── utils/            # Helper scripts and data formatters
│   ├── App.jsx           # Routing configuration
│   └── index.css         # Styling system
├── simulation_results/   # Saved runs from the Match Simulator
├── vite.config.js        # Vite build and POST intercept dev server
└── DOCUMENTATION.md      # Detailed developer log & roadmap
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/navaneeth0408/world-cup.git
   cd worldcup-2026
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 💻 Running Locally
To launch the Vite development server with the POST simulation saving endpoint active:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 📦 Building for Production
To build and compile static assets:
```bash
npm run build
```
Preview the production build:
```bash
npm run preview
```
