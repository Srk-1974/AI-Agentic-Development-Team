<div align="center">
  <img src="./public/logo.png" width="120" alt="App Logo" />
</div>

# 📱 Kya Haal Chaal? (क्या हाल चाल?) 
## *Premium P2P Recruitment & Messaging Intelligence*

Welcome to the official demonstration guide for **Kya Haal Chaal?**, a state-of-the-art, peer-to-peer (P2P) communication platform built with React, Vite, and PeerJS. Now supporting **Hindi (हिंदी)** and **Telugu (తెలుగు)** for a truly inclusive experience.

---

## 🌟 Key Capabilities

### 1. 💬 Real-Time Messaging (P2P)
Directly connect with contacts using high-security peer-to-peer protocols. No central server stores your private conversations.
- **Multilingual Support**: Chat effortlessly in **Hindi**, **Telugu**, or **English**.
- **Instant Sync**: Messages appear in real-time across connected devices.
- **Emoji Support**: Integrated premium emoji picker for expressive communication.
- **Persistence**: All contacts and message histories are saved safely in your local browser storage.

### 2. 📞 HD Video & Voice Calls
Experience crystal-clear communication via WebRTC.
- **Video Calling**: Full-screen immersive video experience with local selfie preview.
- **Voice Calling**: High-fidelity audio for quick coordination.
- **Call Controls**: One-touch mute and end-call functionality.

### 3. 👥 Smart Contact Management
- **Unique Peer IDs**: Every user gets a dedicated 9-digit identity.
- **Custom IDs**: Set your own "Phone Number" style ID for easier sharing.
- **Dynamic Discovery**: Add users instantly by their Peer ID.

---

## 📸 Component Walkthrough

### 📱 The Main Dashboard
The interface features a dual-pane layout (on desktop) or a fluid transition (on mobile):
- **Left Panel**: Searchable contact list with status indicators.
- **Right Panel**: The active chat window showcasing the premium "WhatsApp-style" message bubbles.

### 🎥 The Calling Experience
When a call is initiated or received:
- **Incoming Call Overlay**: Animated glassmorphism alert with "Answer" and "Reject" options.
- **Talking Mode**: Local video appears in the top-right corner while the remote participant takes the main stage.

---

## 🛠️ Technical Excellence

| Technology | Purpose |
|---|---|
| **React 18** | Core UI Architecture |
| **PeerJS** | P2P Connectivity & Signaling |
| **Framer Motion** | Premium Animations & Transitions |
| **Lucide React** | Sleek, Modern Iconography |
| **Vite** | Lightning-fast Build Tooling |

---

## 🚀 How to Launch the Demo

### 1. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Multi-Device Testing
To test real calling and messaging between two devices (e.g., Laptop and Phone):
1. **Note your ID** shown at the top of the app.
2. **Open the app** on a second device or private window.
3. **Add the first ID** as a contact on the second device.
4. **Make a Call!**

> 💡 **Important**: For mobile-to-laptop testing, refer to the [TESTING.md](./TESTING.md) guide for HTTPS setup via ngrok.

---

*© 2026 BHADRADRI Technologies Inc. | Premium Agentic Solutions*
