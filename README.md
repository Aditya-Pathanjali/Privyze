# 🛡️ Privyze — Real-Time Privacy Intelligence Platform

**Privyze** is a next-generation web intelligence platform that reveals hidden data flows, explains them using AI, and quantifies their environmental impact — all in real time.

> See what the web hides from you.

---

## 🌍 Live Demo

👉 https://privyze.vercel.app/

---

## 🚀 What Makes Privyze Unique

Privyze is not just a tracker blocker — it is a **full observability layer for the web**.

It combines:

* 🔍 Real-time network inspection
* 🤖 AI-powered explanations
* 🔒 Sandbox-based safe execution
* 🌱 Carbon impact analysis
* ♿ Accessibility-first design
* 🏥 Healthcare-aware privacy protection

---

## ✨ Core Features

### 🌐 Sandbox Browser Execution

* Runs websites inside a secure isolated environment (BrowserPod + Playwright)
* Prevents direct execution in the user’s browser
* Captures full network activity safely

---

### 📡 Real-Time Network Monitoring

* Live visualization of:

  * Domains contacted
  * Request counts
  * Data transfer size
* Categorization:

  * 🔴 Trackers
  * 🟠 Analytics
  * 🟡 Ads
  * 🔵 APIs

---

### 🤖 AI-Powered Explanations

* Click any domain → get instant explanation
* Uses **Google Gemini API**
* Converts technical tracking into plain English
* Accessibility mode: simplified, ELI5 explanations

---

### 🔒 Smart Blocking Engine

* One-click tracker blocking
* Block:

  * Trackers
  * Third-party domains
  * Scripts
* Live reload with instant effect
* Real-time before/after comparison

---

### 🌱 Carbon Impact Meter

* Calculates emissions caused by data transfer
* Shows:

  * Total CO₂
  * Reduction %
  * Saved emissions
* Makes privacy a **climate action**

---

### 🏥 Healthcare Privacy Mode

* Detects sensitive health-related content
* Automatically:

  * Enables stricter blocking
  * Activates accessibility mode
* Prevents leakage of critical user data

---

### ♿ Accessibility First

* Screen-reader friendly
* High contrast UI
* Simplified explanations
* Low cognitive load design

---

### 📊 Live Graph & Data Flow Visualization

* Network graph showing connections between domains
* Flow visualization of data movement
* Real-time updates

---

### 🧠 AI Insight Panel

* Explains:

  * What the domain does
  * Why it's tracking
  * Risk level
* Helps non-technical users understand privacy

---

### 🕘 History (New Feature)

* Track previously analyzed websites
* Quick navigation to past sessions
* Compare behavior across sites

---

## 🧩 System Architecture

```
Frontend (Next.js + React)
│
├── Hero + Command Bar
├── Sandbox View
├── Network Graph
├── Data Flow Panel
├── AI Explanation Panel
├── Carbon Meter
└── Controls Panel

Backend (Next.js API Routes)
│
├── /api/session   → BrowserPod session
├── /api/network   → Network data
├── /api/block     → Blocking engine
└── /api/explain   → AI explanations

Services Layer
│
├── BrowserPod (Playwright sandbox)
├── Network Analysis Engine
├── AI Service (Gemini)
└── Carbon Estimator
```

---

## ⚙️ How It Works

1. User enters a URL
2. Site loads in a sandboxed browser
3. All network requests are intercepted
4. Domains are classified and visualized
5. User explores domains → AI explains them
6. User applies filters (block trackers/scripts)
7. Page reloads → metrics update in real-time
8. Carbon impact is recalculated

---

## 🧪 Demo URLs

Try these for best results:

* https://www.bbc.com → Heavy tracking
* https://medium.com → Analytics-heavy
* https://github.com → Mixed behavior
* https://example.com → Minimal tracking

---

## 🛠️ Tech Stack

### Frontend

* Next.js 14 (App Router)
* React 18
* TypeScript
* Tailwind CSS
* Framer Motion (animations)

### Backend

* Next.js API Routes

### Core Engines

* BrowserPod (Sandbox execution)
* Playwright (Network interception)

### AI

* Google Gemini API (explanations)

### Data

* In-memory session management

---

## 📁 Project Structure

```
privyze/
├── app/
│   ├── page.tsx
│   ├── api/
│   │   ├── session/
│   │   ├── network/
│   │   ├── block/
│   │   └── explain/
│   └── layout.tsx
│
├── components/
│   ├── Hero.tsx
│   ├── CommandBar.tsx
│   ├── SandboxView.tsx
│   ├── NetworkGraph.tsx
│   ├── DataFlowPanel.tsx
│   ├── AIExplanation.tsx
│   ├── CarbonMeter.tsx
│   └── ControlsPanel.tsx
│
├── hooks/
│   ├── useBrowserPod.ts
│   └── useNetworkTracking.ts
│
├── lib/
│   ├── services/
│   │   ├── browserpod.ts
│   │   ├── network.ts
│   │   ├── ai.ts
│   │   └── carbon.ts
│   └── types.ts
│
└── public/
```

---

## ⚙️ Environment Setup

Create `.env.local`:

```env
BROWSERPOD_API_KEY=your_key
GEMINI_API_KEY=your_key
NEXT_PUBLIC_API_URL=https://privyze.vercel.app
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/Aditya-Pathanjali/Privyze.git
cd Privyze
npm install
npm run dev
```

Open:
👉 http://localhost:3000

---

## 📊 Carbon Calculation Model

```
CO₂ (g) = Data Transfer (KB) × 0.0002
```

Based on average data center energy usage.

---

## 🔮 Future Roadmap

* 🔐 Browser extension version
* 📱 Mobile app
* 📊 Advanced analytics dashboard
* 🧠 Smarter AI risk scoring
* 🔄 Session comparison engine

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License

---

## ❤️ Built for a better web

Privyze turns invisible data flows into something you can see, understand, and control.
