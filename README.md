# CookiePulse: Real-Time Network Analytics, Validator Telemetry & Account Inspector for Cookie Chain (SVM)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cookie Chain SVM](https://img.shields.io/badge/Network-Cookie%20Chain%20SVM-orange)](https://cookiechain.wtf)
[![RPC](https://img.shields.io/badge/RPC-rpc.cookiescan.io-blue)](https://rpc.cookiescan.io)

**CookiePulse** is a lightweight, responsive, and high-performance decentralized web application (dApp) built natively for **Cookie Chain** — the high-throughput SVM execution environment.

---

## 🌟 Features & Highlights

1. **Live SVM Telemetry**:
   - Real-time Slot, Block Height, and Transaction Count tracking directly queried from `https://rpc.cookiescan.io`.
   - Dynamic Epoch progress indicator (slots completed vs. total 432,000 slots per epoch).
   - Consensus layer tracking: Latest verified Blockhash and Genesis Hash (`9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`).
2. **Interactive Account & Program Inspector**:
   - Live Base58 address lookup for standard accounts, executable programs, and token mints.
   - Decodes account owner, executable status, lamport balance, data size, and rent epoch.
   - Quick testing chips for core SVM programs (`System Program`, `SPL Token`, `Compute Budget`).
3. **Wallet Connectivity**:
   - Supports **Nightly Wallet** and standard Solana/SVM wallet providers.
   - Reads native `$COOKIE` wallet balances on Cookie Chain.
4. **Cookie Chain Bridge Guide**:
   - Integrated onboarding directing users to the [Cookie Chain Official Bridge](https://bridge.cookiechain.wtf) to bridge liquidity onto the SVM network.

---

## 🚀 Live Demo & Deployed URLs

- **Live Application**: [https://cookie-pulse.pages.dev](https://cookie-pulse.pages.dev) (or local preview: `npm run preview`)
- **GitHub Repository**: [https://github.com/1998LJ/cookie-pulse](https://github.com/1998LJ/cookie-pulse)
- **Cookie Chain Explorer**: [https://cookiescan.io](https://cookiescan.io)
- **Cookie Chain RPC**: `https://rpc.cookiescan.io`

---

## 🛠️ Local Development & Build

### Prerequisites
- Node.js >= 18.x
- npm / yarn / pnpm

### Quickstart
```bash
# Clone the repository
git clone https://github.com/1998LJ/cookie-pulse.git
cd cookie-pulse

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

---

## 🔐 Architecture & Safety Rules
- **Pure Client-Side**: No backend servers storing user keys. All RPC calls go directly to the public Cookie Chain RPC (`https://rpc.cookiescan.io`).
- **Non-Custodial**: Connects via wallet standard without requesting sensitive permissions.

---

## 📄 License
MIT License. Free and open source.
