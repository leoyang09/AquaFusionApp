# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0 before writing any code.

---

# AquaFusion App - Engineering Design Context

## Tech Stack & Architecture
- **Framework**: React Native with Expo Router (Expo SDK 56 Tabs template)
- **Backend**: Supabase (Realtime postgres changes listener)
- **Data Source**: Microcontroller edge processing (Kalman filter + Autoencoder flag over LoRaWAN)

## Code & Naming Conventions
- Component Files: Use clean, descriptive functional components with standard StyleSheet or Tailwind.
- Use explicit JavaScript objects for state mapping.
- Prioritize atomic components; keep screens modular.

## UI/UX Rules
- Primary Theme: Continuous premium dark blue linear gradient (`#001C44` to `#003B80`).
- Card Style: Glassmorphism layout using `rgba(255, 255, 255, 0.08)` with soft drop shadows and `borderRadius: 16`.
- Interactivity: Always wrap interactive cards/buttons in responsive `TouchableOpacity` feedback.
- Status Mapping: Green for standard operation, Red/Blinking Yellow for autoencoder anomaly flags.
