# LLM-Controlled GPS-Denied Autonomous Drone — Control Dashboard

A production-ready React dashboard for controlling a drone simulation through
natural language commands via Phi-3 (Ollama), with live ROS telemetry and video.

---

## Prerequisites

| Tool        | Version  | Purpose                  |
|-------------|----------|--------------------------|
| Node.js     | ≥ 18     | Run the dev server       |
| npm         | ≥ 9      | Install packages         |
| Ollama      | any      | Local LLM inference      |
| ROS 2       | any      | (optional) real drone    |
| rosbridge   | any      | ROS ↔ WebSocket bridge   |

---

## Quick Start

### 1. Install dependencies
```bash
cd drone-dashboard
npm install
```

### 2. Configure your environment
Open `.env` in the project root. This is the **only file** you need to edit:

```env
# Ollama — change only if not running on localhost:11434
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=phi3          # or phi3:mini, llama3, mistral, etc.

# ROS — set to the IP of your ROS machine
VITE_ROS_SERVER_IP=localhost    # ← CHANGE THIS if ROS is on another machine
VITE_ROS_WS_PORT=9090
VITE_VIDEO_PORT=8080
```

### 3. Pull the Phi-3 model in Ollama
```bash
ollama pull phi3
```

### 4. Start Ollama (if not already running)
```bash
ollama serve
# Ollama runs on http://localhost:11434 by default
```

### 5. Run the dashboard
```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Connecting to a Real ROS Setup

### On your ROS machine, run:
```bash
# Install rosbridge if needed
sudo apt install ros-<distro>-rosbridge-server
sudo apt install ros-<distro>-web-video-server

# Launch rosbridge (WebSocket on port 9090)
ros2 launch rosbridge_server rosbridge_websocket_launch.xml

# Launch web_video_server (MJPEG stream on port 8080)
ros2 run web_video_server web_video_server
```

### Then update `.env`:
```env
VITE_ROS_SERVER_IP=192.168.1.42    # ← your ROS machine's IP
```

The dashboard auto-reconnects every 3 seconds if the connection drops.

---

## Connecting to a Different Ollama Model

Just change one line in `.env`:
```env
VITE_OLLAMA_MODEL=llama3       # or mistral, phi3:mini, gemma, etc.
```

Make sure you've pulled it first:
```bash
ollama pull llama3
```

---

## Ollama CORS Setup (if needed)

If you see CORS errors in the browser console, start Ollama with:
```bash
OLLAMA_ORIGINS="http://localhost:3000" ollama serve
```

Or on macOS/Linux, add to your shell profile:
```bash
export OLLAMA_ORIGINS="*"
```

The Vite dev server also proxies `/ollama` → `localhost:11434` as a fallback.

---

## Project Structure

```
drone-dashboard/
├── .env                          ← ✅ Edit this for all config
├── vite.config.js
├── src/
│   ├── main.jsx                  ← Entry point
│   ├── App.jsx                   ← Root component + state wiring
│   ├── index.css                 ← Global styles + CSS variables
│   │
│   ├── services/
│   │   ├── config.js             ← Reads .env, exports config object
│   │   ├── ollamaService.js      ← Streaming LLM calls + JSON parsing
│   │   └── rosService.js         ← rosbridge WebSocket + pub/sub
│   │
│   ├── hooks/
│   │   ├── useROS.js             ← React wrapper for rosService
│   │   ├── useChat.js            ← Message state + LLM calls
│   │   └── useTelemetryHistory.js← Rolling window for charts
│   │
│   ├── utils/
│   │   └── validation.js         ← Safety clamps + format helpers
│   │
│   └── components/
│       ├── TopBar.jsx            ← Nav bar, status pills, E-STOP
│       ├── ChatPanel.jsx         ← LLM chat UI + history
│       ├── JSONView.jsx          ← Syntax-highlighted JSON
│       ├── VideoPanel.jsx        ← Stream + simulation view
│       ├── DroneViz.jsx          ← Animated SVG drone
│       └── TelemetryPanel.jsx    ← Telemetry cards + charts
```

---

## Safety Features

- All linear velocities clamped to ±1.5 m/s (configurable in `.env`)
- All angular velocities clamped to ±1.0 rad/s (configurable in `.env`)
- Commands with confidence < 0.5 trigger hover instead of executing
- Emergency Stop button publishes zero-velocity Twist instantly
- JSON validation before any ROS publish

---

## Build for Production

```bash
npm run build
# Output in dist/ — serve with any static file server
npm run preview   # preview the production build locally
```
