# REC Marketplace Backend API

A professional Node.js backend for the REC (Renewable Energy Certificate) Marketplace. This application provides a modular, portable, and deployable copy of all core logic, including smart contract interactions, ENS registration, AI services, and ZK verification.

## 🚀 Key Features

- **Smart Contract Services**: Complete interaction with the REC Marketplace on Base Sepolia.
- **ENS Automation**: Multi-step subdomain registration on Ethereum Sepolia.
- **AI Intent Parsing**: Integration with Google Gemini for natural language REC trading commands.
- **ZK Verification**: Integration with Reclaim Protocol for Zero-Knowledge URL verification.
- **Metadata Storage**: Fileverse dDocs integration for secure trade receipts.
- **Modular Architecture**: Clean separation of routes, controllers, and services.
- **Ready for Vercel**: Pre-configured with `vercel.json` for serverless deployment.

## 🛠 Project Structure

```text
api/
├── src/
│   ├── config/      # Ethers & ABI configuration
│   ├── controllers/ # Request handling logic
│   ├── routes/      # Express API routes
│   ├── services/    # Business logic (ENS, AI, Blockchain)
│   └── app.js       # Express app setup
├── index.js         # Entry point (Vercel/Local)
├── package.json     # Dependencies & Scripts
├── vercel.json      # Vercel deployment config
└── .env.example     # Environment template
```

## ⚙️ Setup & Installation

1.  **Clone/Copy** the `api` folder.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  **Run Locally**:
    ```bash
    npm start
    ```
    For development with auto-reload:
    ```bash
    npm run dev
    ```

## 📡 API Endpoints

### ENS & Identity
- `POST /api/ens/register`: Body: `{ label, userAddress }`
- `POST /api/marketplace/link-ens`: Body: `{ userPrivateKey, fullName, role, subnode }`

### Marketplace Registration
- `POST /api/marketplace/register-producer`: Body: `{ userPrivateKey, gst, location, energyTypes }`
- `POST /api/marketplace/register-buyer`: Body: `{ userPrivateKey }`

### Token Actions
- `POST /api/marketplace/mint`: Body: `{ userPrivateKey, amount, energyType, zkProofHash }`
- `POST /api/marketplace/list`: Body: `{ userPrivateKey, amount, pricePerToken, energyType, zkProofHash }`
- `POST /api/marketplace/buy`: Body: `{ userPrivateKey, listingId, amount, fileverseDocHash }`
- `POST /api/marketplace/retire`: Body: `{ userPrivateKey, amount, energyType }`

### AI & Services
- `POST /api/ai/chat`: Body: `{ input }` (Parses intent into contract calls)
- `POST /api/fileverse/upload`: Body: `{ metadata }`
- `POST /api/reclaim/init`: Body: `{ url }` (Returns QR code URL and sessionId)
- `GET /api/reclaim/status/:sessionId`: Poll verification status

### Getters (Read-Only)
- `GET /api/marketplace/info/:address`
- `GET /api/marketplace/balance/:address/:energyType`
- `GET /api/marketplace/listing/:id`

## ☁️ Deployment

This project is configured for Vercel. Deploy with a single command:
```bash
vercel
```
Ensure all environment variables from `.env.example` are configured in your Vercel project settings.
