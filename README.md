# Letta Manager

A premium, modern Linux desktop application built with Electron to manage and visualize your **Letta** (formerly MemGPT) server.

![Letta Manager UI](https://img.shields.io/badge/UI-Glassmorphism-blue)
![Letta Manager Tech](https://img.shields.io/badge/Tech-Electron%20%7C%20Vanilla%20JS-green)

![Neural Map Visualization](https://raw.githubusercontent.com/porya0ras/letta-manager/main/assets/neural-map.png)

## 🌟 Features

-   **Dashboard:** Real-time overview of your server status, total agents, and data sources.
-   **Agent Management:** View and manage your autonomous agents and their configurations.
-   **Neural Map:** Interactive, physics-based visualization of your agent-memory network ( neuronal network style).
-   **Memory Blocks:** Manage shared memory blocks like personas and human contexts.
-   **Skills (Tools):** Monitor and manage executable skills available to your agents.
-   **Documents (Sources):** View and manage data sources for RAG and agent context.
-   **Modern UI:** Sleek glassmorphism design with a dark mode aesthetic, smooth animations, and Inter typography.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher recommended)
-   [Letta Server](https://github.com/letta-ai/letta) running locally (default: `http://localhost:8283`)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/letta-manager.git
    cd letta-manager
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the application:
    ```bash
    npm start
    ```

## ⚙️ Configuration

By default, the app connects to `http://localhost:8283`. You can change the server URL in the **Settings** section of the app.

## 🛠️ Built With

-   [Electron](https://www.electronjs.org/) - Desktop framework
-   [vis-network](https://visjs.github.io/vis-network/docs/network/) - For the Neural Map visualization
-   [Font Awesome](https://fontawesome.com/) - Modern iconography
-   [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter) - Clean typography

## 📄 License

This project is licensed under the ISC License.
