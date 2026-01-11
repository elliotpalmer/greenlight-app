# GreenLight Putting App - Product Roadmap

**Vision:** To become the ultimate tour-grade putting assistant, leveraging AI, Computer Vision, and Physics to eliminate doubt and lower scores for golfers of all levels.

## 🧭 Strategic Pillars

1.  **Precision Green Reading:** Moving from manual input to automated sensing (Vision/AR).
2.  **Performance Intelligence:** Turning simple make/miss data into actionable "Strokes Gained" insights.
3.  **Active Coaching:** AI-driven drills and tempo training to improve the stroke itself.
4.  **Ecosystem:** Seamless experience across devices (Cloud, Watch, Social).

---

## 🚀 Phase 1: Foundation & Core Experience (Current Quarter)
*Goal: Polish the current manual tool into a seamless, bug-free utility.*

| Feature | Priority | Complexity | Description |
| :--- | :---: | :---: | :--- |
| **Advanced Voice V2** | 🔴 High | 🟡 Med | Expand current commands. Add "What's my make percentage from here?" or "Suggest a drill". Handle more natural conversation flows regarding wind or grain. |
| **Visualizer Upgrade** | 🔴 High | 🟡 Med | Add 3D perspective to the SVG. Show the "entry cone" (capture speed variance). Visualize grain direction influence. |
| **Tempo Trainer** | 🟡 Med | 🟢 Low | A simple metronome (75-85 BPM) to help users practice rhythm. Toggle button in the UI. |
| **Grain Influence** | 🟡 Med | 🟢 Low | Add a "Grain" slider (Against/With/Cross) that adjusts the effective stimp and break calculation. |

## 👁️ Phase 2: Computer Vision & AR (Next Horizon)
*Goal: Reduce manual data entry and visualize the line in the real world.*

| Feature | Priority | Complexity | Description |
| :--- | :---: | :---: | :--- |
| **CV Slope Estimator** | 🔴 High | 🔴 High | Use the camera to detect the horizon line and green surface texture to estimate side slope automatically. **Tech:** OpenCV/TensorFlow.js. |
| **AR Line Overlay** | 🟡 Med | ⚫ V. High | Overlay the calculated putt path onto the live camera feed. Requires stable AR tracking and ground plane detection. **Tech:** WebXR / 8th Wall (if web) or native wrappers. |
| **Lidar Green Scanning** | 🟡 Med | 🔴 High | (iOS Pro models only) Use Lidar sensor to create a localized mesh of the green for sub-inch precision slope data. |
| **Stimp from Video** | 🟢 Low | 🔴 High | Analyze a video of a ball rolling (using known ball size) to calculate deceleration and estimate Green Speed (Stimp) automatically. |

## 📊 Phase 3: Data & Performance Intelligence
*Goal: Answer the question "Why am I missing?"*

| Feature | Priority | Complexity | Description |
| :--- | :---: | :---: | :--- |
| **Strokes Gained Putting** | 🔴 High | 🟡 Med | Implement the broadie strokes gained formula. Compare user performance against Tour/Scratch benchmarks based on distance. |
| **Heatmap Visualization** | 🟡 Med | 🟡 Med | Visual charts showing "Make Zone" (e.g., 90% inside 5ft) and specific weakness zones (e.g., "You miss 80% of 10ft left-breakers low"). |
| **Session Export** | 🟢 Low | 🟢 Low | Export session data to CSV/PDF for sharing with coaches. |
| **Trend Analysis** | 🟡 Med | 🟡 Med | "You are putting 5% better than last month." Historical trend lines for Stimp reading accuracy and make rates. |

## 🎓 Phase 4: The AI Coach
*Goal: Proactive improvement plans.*

| Feature | Priority | Complexity | Description |
| :--- | :---: | :---: | :--- |
| **Smart Drills** | 🔴 High | 🟡 Med | If user misses 3 right-breakers in a row, suggest the "Gate Drill". AI recommends specific practice routines based on live session data. |
| **Personalized Physics** | 🟡 Med | 🔴 High | Learn the user's "Capture Speed" preference (Die-in vs. Firm). Adjust aim points based on their tendency to hit firm or soft. |
| **Pre-Round Calibration** | 🟡 Med | 🟡 Med | A guided 5-minute pre-round routine to dial in the day's Green Speed and user's tempo. |

## ☁️ Phase 5: Platform & Social
*Goal: Retention and community.*

| Feature | Priority | Complexity | Description |
| :--- | :---: | :---: | :--- |
| **Cloud Sync & Auth** | 🔴 High | 🟡 Med | User accounts (Supabase/Firebase). Sync history between iPad (home) and Phone (course). |
| **Watch Companion** | 🟡 Med | 🔴 High | Standalone WatchOS/WearOS app. View aim point and log result from wrist without touching phone. |
| **Leaderboards** | 🟢 Low | 🟡 Med | Weekly challenges (e.g., "Most 10-footers made"). Friends lists and competitions. |
| **Course Database** | 🟢 Low | ⚫ V. High | Integration with GPS APIs to identify which course/green the user is on. Crowdsourced break maps. |

---

## 🛠️ Technical Debt & Infrastructure

- **Testing Suite:** Add Vitest unit tests for physics engine and React Testing Library for UI components.
- **Offline Storage Upgrade:** Move from LocalStorage to IndexedDB (Dexie.js) for handling large history sets and potential image data.
- **Accessibility (a11y):** Ensure screen readers work for all sliders and results (ARIA labels). High contrast mode for sunny days.
- **Performance:** Optimize AudioWorklet memory usage and bundle splitting for faster PWA load times.
