# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0 before writing any code.

# AquaFusion - Master Engineering & UI Context

This repository is a dual-platform workspace:
1. **Mobile App (Root):** React Native + Expo Router (Dark Blue Glassmorphic UI).
2. **Web App (`/web`):** Standalone React + Tailwind CSS Dashboard (Distinctive, Production-Grade UI).

---

# Web App UI Architecture (`/web`)
When writing code inside the `/web` directory, strictly enforce the `frontend-design` protocol. Avoid cookie-cutter "AI slop" aesthetics. 

### 1. Aesthetic Direction: Premium Marine Industrial / Cyber-Utility
- **Tone**: Brutal-minimal meets premium industrial utility (think high-end scientific telemetry tool or oceanographic tracking console). 
- **Typography**: Do NOT use Inter/Roboto. Pair a sharp, industrial geometric display font (e.g., *Share Tech Mono*, *JetBrains Mono*, or *Syncopate*) with a highly legible, clean sans-serif for numbers and text.
- **Color & Depth**: Evolve the mobile dark blue gradient into something deeper. Use a near-black marine background (`#010B18`) layered with a subtle **noise/grain texture overlay** or SVG geometric grid line backgrounds. Use sharp, electric cyan (`#00F2FF`) or radioactive amber for accents.
- **Spatial Composition**: Avoid rigid rows of identical cards. Use a multi-column command-center grid layout with intentional asymmetry, subtle component overlaps, and wide negative space around critical metrics.
- **Motion**: Implement one beautifully orchestrated page load using **Framer Motion** where the data telemetry grids and Kalman filter graphs stagger reveal with subtle clip-path or fade-up animations.

### 2. Web Development Rules
- **Scope Isolation**: NEVER modify any files outside of the `/web` folder when working on the web app.
- **Data Hooking**: Pull real-time Supabase subscriptions and Kalman filter/Autoencoder state logic directly from the root `src/` directory where possible, but display them inside the new custom web views.
- **Status Mapping**: Make anomaly flags striking—instead of just a red dot, use a glowing, CSS-pulsing perimeter border or a subtle static warning texture around the flagged metric's grid panel.

---

# Mobile App Architecture (Root)
When working outside of the `/web` directory, maintain the legacy mobile specifications:

- **Framework**: React Native with Expo Router (Expo SDK 56 Tabs template).
- **Backend**: Supabase (Realtime postgres changes listener).
- **Data Source**: Microcontroller edge processing (Kalman filter + Autoencoder flag over LoRaWAN).
- **Conventions**: Functional components, atomic modular screens, explicit JS objects for state mapping.
- **UI/UX Style**: Premium dark blue linear gradient (`#001C44` to `#003B80`), Glassmorphism cards (`rgba(255,255,255,0.08)`, radius 16), `TouchableOpacity` feedback. Green for normal ops, Red/Blinking Yellow for autoencoder anomaly flags.
