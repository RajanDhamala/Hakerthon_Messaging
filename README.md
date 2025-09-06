# Hakerthon Messaging

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/Zustand-FFB300?style=for-the-badge&logo=zustand&logoColor=black" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
</p>

---

## Overview

Due to social media bans, communicating with loved ones across borders can be challenging. This project was created to enable secure, private, and reliable communication with my sister living in Japan. It is a custom-built messaging system supporting real-time chat and video calls, designed to bypass restrictions and ensure seamless connectivity.

## Features

- **Real-Time Chat:** Instant messaging using <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" height="20" />
- **Video Calls:** Peer-to-peer video communication with <img src="https://img.shields.io/badge/WebRTC-333333?style=flat-square&logo=webrtc&logoColor=white" height="20" />
- **Authentication:** Secure login and user management
- **State Management:** Efficient state handling with <img src="https://img.shields.io/badge/Zustand-FFB300?style=flat-square&logo=zustand&logoColor=black" height="20" />
- **Caching:** <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" height="20" /> for fast data access and scalability
- **Custom Backend:** Built with <img src="https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white" height="20" /> and <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" height="20" />
- **Frontend:** Modern <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" height="20" /> (<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=FFD62E" height="20" />) application
- **Database:** <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" height="20" /> for persistent storage
- **Scalable Architecture:** Designed for reliability and performance

---

## Tech Stack

| Frontend | Backend | Database | Caching | Video Calls |
|----------|---------|----------|---------|-------------|
| <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" height="20" /> <br> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=FFD62E" height="20" /> <br> <img src="https://img.shields.io/badge/Zustand-FFB300?style=flat-square&logo=zustand&logoColor=black" height="20" /> | <img src="https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white" height="20" /> <br> <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" height="20" /> <br> <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" height="20" /> | <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" height="20" /> | <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" height="20" /> | <img src="https://img.shields.io/badge/WebRTC-333333?style=flat-square&logo=webrtc&logoColor=white" height="20" /> |

---

## Motivation

With mainstream social media platforms banned, this project provides a private and secure way to stay connected with family, regardless of location or restrictions. It is tailored for personal use but can be extended for broader applications.

## How It Works

1. **User Authentication:** Users sign up and log in securely.
2. **Messaging:** Send and receive messages in real time.
3. **Video Calls:** Initiate and join video calls with peers.
4. **State Management:** Zustand keeps UI state fast and predictable.
5. **Caching:** Redis accelerates message delivery and user lookup.
6. **Socket.io:** Enables real-time communication between clients and server.

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- MongoDB
- Redis

### Installation

1. **Clone the repository:**
   ```zsh
   git clone https://github.com/RajanDhamala/Hakerthon_Messaging.git
   ```
2. **Install dependencies:**
   ```zsh
   cd Backend
   npm install
   cd ../Frontend/ChatAPp
   npm install
   ```
3. **Configure environment variables:**
   - Set up MongoDB and Redis connection strings in `.env` files.
4. **Run the backend:**
   ```zsh
   cd ../../Backend
   npm start
   ```
5. **Run the frontend:**
   ```zsh
   cd ../Frontend/ChatAPp
   npm run dev
   ```

## Folder Structure

<details>
  <summary>Click to expand</summary>

  <pre>
Backend/
  app.js
  index.js
  package.json
  src/
    Controller/
    Database/
      ConnectDb.js
    Middlewares/
    Routes/
    Schemas/
    Utils/
      ConnectRedis.js
      SocketConnection.js
Frontend/
  package.json
  ChatAPp/
    components.json
    eslint.config.js
    index.html
    jsconfig.app.json
    jsconfig.json
    package.json
    README.md
    vite.config.js
    public/
      vite.svg
    src/
      App.jsx
      index.css
      main.jsx
      assets/
        react.svg
      components/
        ui/
          button.jsx
      lib/
        utils.js
  </pre>
</details>

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

<p align="left">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" />
</p>

---

**Built for family, privacy, and freedom.**
