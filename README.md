<div align="center">
  <h1>⚡ QuotaDeck AI</h1>
  <p><strong>Open-source AI IDE quota monitor & account manager</strong></p>
  <p>Track your AI coding assistant usage, manage multiple accounts, and never hit a quota limit by surprise.</p>

  <!--
  [![Release](https://img.shields.io/github/v/release/auwus21/quotadeck-ai?style=flat-square)](https://github.com/auwus21/quotadeck-ai/releases)
  [![Downloads](https://img.shields.io/github/downloads/auwus21/quotadeck-ai/total?style=flat-square)](https://github.com/auwus21/quotadeck-ai/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
  [![CI](https://img.shields.io/github/actions/workflow/status/auwus21/quotadeck-ai/ci.yml?style=flat-square)](https://github.com/auwus21/quotadeck-ai/actions)
  -->

  [English](README.md) · [Español](README.es.md)

  <!-- ![QuotaDeck AI Dashboard](docs/images/dashboard-preview.png) -->
</div>

---

## ✨ Features

- **📊 Real-time Quota Monitoring** — Track remaining usage across all AI models with visual progress bars and countdown timers
- **🔄 One-Click Account Switching** — Seamlessly switch between multiple accounts without manual login/logout cycles
- **🔔 Smart Alerts** — Get notified before your quota runs out so you can switch accounts proactively
- **🔒 Secure Storage** — Tokens are encrypted with AES-256-GCM and stored in your OS keychain
- **🌍 Multi-language** — Available in English, Spanish, and Portuguese
- **🪶 Lightweight** — Built with Tauri, the app is under 10MB and uses minimal system resources
- **🖥️ Cross-platform** — Works on Windows, macOS, and Linux

### Currently Supported Platforms

| Platform | Account Management | Quota Monitoring | Account Switching |
|:--------:|:-----------------:|:----------------:|:-----------------:|
| Antigravity | ✅ | ✅ | ✅ |

> More platforms (Cursor, GitHub Copilot, Windsurf) are planned for future releases.

---

## 📦 Installation

### Download

Head to the [Releases](https://github.com/auwus21/quotadeck-ai/releases) page and download the installer for your operating system:

- **Windows**: `.msi` (recommended) or `.exe`
- **macOS**: `.dmg` (Apple Silicon & Intel)
- **Linux**: `.deb` (Debian/Ubuntu) or `.AppImage` (universal)

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies — see [Development Setup](docs/development/setup.md)

```bash
# Clone the repository
git clone https://github.com/auwus21/quotadeck-ai.git
cd quotadeck-ai

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## 🚀 Quick Start

1. **Launch QuotaDeck AI** after installation
2. **Add an account** — Click "Add Account" and authenticate via OAuth or paste your refresh token
3. **Monitor quotas** — The dashboard shows real-time usage for all models
4. **Switch accounts** — Click "Activate" on any account to switch instantly

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/overview.md) | System design and component interaction |
| [Development Setup](docs/development/setup.md) | How to set up the project for local development |
| [Coding Standards](docs/development/coding-standards.md) | Code style guide and conventions |
| [Contributing Guide](CONTRIBUTING.md) | How to contribute to the project |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Runtime | [Tauri v2](https://v2.tauri.app/) | Lightweight native app shell |
| Frontend | [React 19](https://react.dev/) + TypeScript | User interface |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| State Management | [Zustand](https://zustand.docs.pmnd.rs/) | Lightweight state management |
| Animations | [Framer Motion](https://www.framer.com/motion/) | Micro-animations and transitions |
| Backend | [Rust](https://www.rust-lang.org/) | Native performance, security |
| Database | SQLite (rusqlite) | Local persistent storage |
| Encryption | AES-256-GCM + OS Keychain | Secure token storage |

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

### Quick Start for Contributors

```bash
git clone https://github.com/auwus21/quotadeck-ai.git
cd quotadeck-ai
npm install
npm run tauri dev
```

See [Development Setup](docs/development/setup.md) for detailed instructions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## ⚠️ Disclaimer

This project is intended for personal use to help manage your own AI IDE accounts. By using this software, you acknowledge that:

- You are responsible for complying with the Terms of Service of the AI platforms you use
- The authors are not responsible for any consequences arising from the use of this tool
- This tool does not collect, transmit, or store any data on external servers

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — For the incredible desktop framework
- [Antigravity-Manager](https://github.com/lbjlaq/Antigravity-Manager) — For pioneering account switching concepts
- The open-source community for making projects like this possible
