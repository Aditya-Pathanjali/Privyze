# 🛡️ Data Guardian — Real-Time Privacy + Carbon Tracker

An interactive web application that reveals who's collecting your data in real-time, explains their behavior with AI, and shows the carbon impact of tracking.

**Perfect for**: Privacy-conscious users, hackathon demos, educational purposes

## ✨ Key Features

### 🌐 Sandbox Browser
- Load any website in an isolated Playwright session
- See all network activity as it happens
- Guaranteed safe execution in controlled environment

### 👁️ Live Data Tracking Panel
- Real-time list of all domains contacted
- Request counts and total data transferred per domain
- Color-coded classification: trackers 🔴, analytics 🟠, ads 🟡, APIs 🔵

### 🤖 AI-Powered Explanations
- Select any domain to get an instant AI explanation
- Claude API generates plain-English summaries
- Streaming responses with typing effect
- Healthcare mode: Simple language for accessibility

### 🔒 One-Click Blocking
- Block all trackers with a single click
- Watch the page reload with tracking disabled
- Real-time metrics update showing reduction

### 🌱 Carbon Impact Meter
- Visualize the carbon cost of data transfer
- See before/after comparison
- Percentage reduction clearly displayed
- Example: "You reduced emissions by 70%"

### ♿ Accessibility Features
- Toggle accessibility mode for larger text
- Simplified explanations (ELI5 style)
- Screen-reader friendly UI

### 🏥 Healthcare Privacy
- Auto-detects health-related pages
- Auto-enables tracker blocking
- Shows privacy alert banner

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and install
cd data-guardian
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  URLInput → SandboxView → DataFlowPanel → Controls  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   POST /session  GET /network  POST /block
        │          │          │
┌───────▼──────────▼──────────▼───────────────────────┐
│            API Routes (Next.js)                      │
└──────────────────┬─────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
   BrowserPod    Network        AI
   Services      Analysis       Service
   (Playwright)  Service        (Claude)
```

### Demo Flow

1. **Enter URL** → `https://www.example.com`
2. **Sandbox loads** → BrowserPod spawns Playwright session
3. **Network intercepts** → All requests logged in real-time
4. **Data panel fills** → Shows trackers found
5. **Select domain** → Claude explains its purpose
6. **Click block** → Tracker domains blocked, page reloaded
7. **Metrics update** → Carbon reduction shown visually

## 🏆 Demo URLs to Try

- `https://www.bbc.com` — News site with many trackers
- `https://www.github.com` — Developer site with mixed trackers
- `https://www.example.com` — Minimal tracking

## 📁 Project Structure

```
data-guardian/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── api/
│   │   ├── session/route.ts  # Create/manage sessions
│   │   ├── network/route.ts  # Get network stats
│   │   ├── block/route.ts    # Block/unblock domains
│   │   └── explain/route.ts  # AI explanations
│   └── layout.tsx
├── components/
│   ├── URLInput.tsx
│   ├── SandboxView.tsx
│   ├── DataFlowPanel.tsx
│   ├── AIExplanation.tsx
│   ├── CarbonMeter.tsx
│   └── ControlsPanel.tsx
├── hooks/
│   ├── useBrowserPod.ts
│   └── useNetworkTracking.ts
├── lib/
│   ├── types.ts
│   ├── constants.ts
│   └── services/
│       ├── browserpod.ts
│       ├── network.ts
│       ├── ai.ts
│       └── carbon.ts
└── package.json
```

## 🧪 Testing the App

### Test Case 1: Basic Tracking Detection
```
1. Open app at http://localhost:3000
2. Enter: https://www.bbc.com
3. Wait 5-10 seconds for data to load
4. Observe data panel filling with domains
5. Look for red dots (trackers) in the list
```

### Test Case 2: AI Explanations
```
1. After data loads, click on any domain
2. Right panel shows "What's This?" section
3. Watch as Claude AI streams explanation
4. Read the plain-English description
```

### Test Case 3: Blocking Impact
```
1. Observe carbon meter showing total impact
2. Click "Block [N] Trackers" button
3. Page reloads inside sandbox
4. Observe carbon meter decrease
5. See success message with % reduction
```

## 🎨 UI Design

- **Dark theme**: Slate-950 background with blue/purple accents
- **Real-time updates**: Smooth animations for metric changes
- **Color coding**: Red for trackers, orange for analytics, yellow for ads, blue for APIs

## 🔧 Configuration

### Tracker Detection

Trackers are identified through:
1. **Known domains list** (100+ trackers)
2. **Pattern matching** (analytics, ads, tracking keywords)
3. **Request type heuristics** (fetch/xhr from non-API domains)

### Carbon Calculation

```
CO₂ = Data Transfer (KB) × 0.0002 g CO₂/KB
```

Based on average data center energy consumption.

## 📚 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Sandbox**: Playwright + BrowserPod
- **AI**: Claude Haiku API for streaming explanations
- **State Management**: In-memory sessions

## 🎓 For Hackathon Judges

✅ **Creativity**: Unique combination of privacy + AI + carbon impact  
✅ **Technical Depth**: BrowserPod sandbox, Playwright interception, Claude streaming  
✅ **Impact**: Relevant to any internet user  
✅ **UX**: 3-second onboarding, clean dark interface, real-time feedback  

---

**Built with ❤️ + 🌱 for privacy-conscious internet users**

