# 🎵 DJ Queue System

> **A Real-Time, Democratic Music Request Platform for Modern Venues.**
> *Empower your audience. Empower your DJ.*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Stack](https://img.shields.io/badge/stack-MERN-orange.svg)

---

## 📖 Overview

The **DJ Queue System** is a cutting-edge web application designed to gamify the music request experience. Gone are the days of shouting requests at the DJ booth. With this system, guests scan a QR code, request songs, and **vote** on the queue in real-time. The most popular songs rise to the top, giving the crowd control over the vibe while the DJ maintains final approval.

### 🌟 Key Features

*   **⚡ Real-Time Interaction**: Built with `Socket.io` for instant updates. When a user votes, everyone sees it immediately.
*   **🗳️ Democratic Playlist**: A Reddit-style upvote system ensures the crowd's favorites get played.
*   **📱 3-in-1 Architecture**:
    *   **Guest App**: Mobile-first interface for requesting and voting.
    *   **DJ Dashboard**: Professional command center to accept/reject requests.
    *   **Admin Portal**: Complete venue management and system control.
*   **💾 Zero-Config Database**: Powered by a high-performance, file-based JSON database engine. No complex SQL setup required.
*   **🛡️ Role-Based Security**: Secure authentication for Admins and DJs, with anonymous sessions for guests.

---

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion
*   **Backend**: Node.js, Express
*   **Real-Time**: Socket.io
*   **Storage**: Custom JSON-based Persistence Layer

---

## 🚀 Quick Start

For a detailed, step-by-step guide on setting up, deploying, and using this project, please refer to the **[Master User Manual](./Master_User_Manual.md)**.

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation (Brief)

1.  **Backend Setup**:
    ```bash
    cd DJ_Backend
    npm install
    npm run dev
    ```

2.  **Frontend Setup**:
    ```bash
    cd "3D Dynamic Music Frontend"
    npm install
    npm run dev
    ```

3.  **Access**:
    *   Admin/DJ/User: `http://localhost:3000`

---

## 📂 Project Structure

```bash
📦  DJ Queue System
├── 📂 3D Dynamic Music Frontend  # The User Interface (React)
│   ├── 📂 apps
│   │   ├── 📂 admin              # Admin Portal Source
│   │   ├── 📂 dj                 # DJ Dashboard Source
│   │   └── 📂 queue              # Guest App Source
│   └── ...
└── 📂 DJ_Backend                 # The Server (Node.js)
    ├── 📂 src                    # API Logic & Routes
    ├── 📂 db                     # Database Files (JSON)
    └── 📜 Master_User_Manual.md  # 📘 THE COMPLETE GUIDE
```

---

## 📚 Documentation

We have prepared extensive documentation to help you get the most out of this system.

### [📘 READ THE MASTER USER MANUAL](./Master_User_Manual.md)

**Topics Covered:**
*   ✅ **Deep Dive Architecture**: How the 3 apps communicate.
*   ✅ **Setup Guide**: Detailed instructions for Local & Cloud environments.
*   ✅ **Deployment**: configuring `.env` variables for production.
*   ✅ **User Guides**: Specialized manuals for Admins, DJs, and Guests.
*   ✅ **Troubleshooting**: Solutions for common connection issues.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for Music Lovers.*
