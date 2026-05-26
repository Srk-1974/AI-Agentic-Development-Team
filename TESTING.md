# Mobile Testing Guide

To test the application on mobile (Laptop <-> Mobile), you need to overcome a few browser security restrictions.

## ⚠️ The Problem: HTTPS Requirement
Mobile browsers (Chrome on Android, Safari on iOS) **BLOCK** camera and microphone access on insecure connections (http://). 
*   `http://localhost` is considered secure (works on laptop).
*   `http://192.168.x.x` (your local IP) is **NOT** secure (camera fails on mobile).

To test on mobile, you need an **HTTPS** URL.

## ✅ Solution: Use a Tunnel (ngrok)
[ngrok](https://ngrok.com) creates a secure public URL (https://...) that tunnels to your local running app.

### Steps to Setup

1.  **Start your App Locally**
    *   Open your terminal in VS Code.
    *   Run `npm run dev`.
    *   Note the port (usually `5173`).

2.  **Install & Run ngrok**
    * https://ngrok.com/download).  Download ngrok from [ngrok.com](
    *   Open a *new* terminal window (PowerShell or Command Prompt).
    *   Run the command:
        ```bash
            
        ```
        *(Replace `5173` with your actual port if different)*

3.  **Get the Public URL**
    *   ngrok will show a URL looking like: `https://abcd-123-456.ngrok-free.app`
    *   Copy this URL.

4.  **Test Connection**
    *   **Laptop**: Open the ngrok URL in your browser.
    *   **Mobile**: Open the *same* ngrok URL in Chrome/Safari.
    *   **Verify**: You should see the login/main screen on both.

### How to Test Calls & Messages

1.  **Get Peer IDs**
    *   On Laptop: Click the "ID: ..." badge to see/copy your ID (e.g., `123`).
    *   On Mobile: Note its ID (e.g., `456`).

2.  **Add Contacts (Optional)**
    *   Click the "Add User" (+) icon.
    *   Enter a Name (e.g., "Mobile").
    *   Enter the **Phone Number** as the **Peer ID** of the other device (e.g., `456`).

3.  **Make a Call**
    *   Click the Video/Phone icon.
    *   Allow Camera/Mic permissions when prompted.

4.  **Send a Message**
    *   Go to the chat screen.
    *   Type a message and send.
    *   Verify it appears instantly on the other device.

---

## 🛠️ Troubleshooting

**"Camera/Mic access denied"**
*   Make sure you are using the **HTTPS** version of the ngrok link, not HTTP.
*   Check Android/iOS settings to ensure the browser has permission to use the camera.

**"Peer unavailable"**
*   Ensure both devices are open on the exact same ngrok URL.
*   Refresh both pages to ensure new Peer IDs are generated and connected.
