# Cloudflare AI Chat Demo

This is a demo project showcasing a full-stack chat application built entirely on the Cloudflare stack, featuring AI capabilities.

## Features

*   **AI-Powered Chat:** Engage in conversations powered by Cloudflare AI text generation models.
*   **Real-time Communication:** Uses WebSockets via Cloudflare Durable Objects for instant message delivery.
*   **Text-to-Speech (TTS):** Hear AI responses spoken aloud using Cloudflare AI TTS.
*   **Speech-to-Text (STT):** Dictate your messages using Cloudflare AI STT (Whisper).
*   **Conversation Management:** Create, rename, pin, and delete conversations.
*   **Model Selection:** View available Cloudflare AI text generation models.
*   **Anonymous Sessions:** Simple authentication using tokens stored in Cloudflare KV.
*   **Modern Tech Stack:**
    *   **Backend:** Cloudflare Workers, Durable Objects, KV, AI Gateway, TypeScript, ConnectRPC, Drizzle ORM (potentially for future database integration).
    *   **Frontend:** React, TypeScript, Vite, TailwindCSS, React Router.
    *   **API:** Protocol Buffers (protobuf) for type-safe communication.

## Project Structure

```
.
├── backend/         # Cloudflare Worker backend code (TypeScript)
├── frontend/        # React frontend application (TypeScript, Vite)
├── proto/           # Protocol Buffer definitions for the API
├── buf.gen.yaml     # Buf code generation configuration
├── buf.yaml         # Buf linting and breaking change detection configuration
├── deploy.sh        # Deployment script (likely for Cloudflare Workers)
└── README.md        # This file
```

## Getting Started

*(Instructions need to be added here based on how to set up environment variables, install dependencies for both frontend and backend, and run the development servers.)*

### Prerequisites

*   Node.js and pnpm
*   Cloudflare Account
*   Wrangler CLI
*   Buf CLI (optional, for protobuf generation)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```
2.  **Configure Cloudflare:**
    *   Set up necessary Cloudflare resources (KV namespace, Durable Object binding, AI Gateway).
    *   Create a `.dev.vars` file in the `backend/` directory with your Cloudflare credentials and bindings (refer to `backend/wrangler.jsonc`).
3.  **Install Dependencies:**
    ```bash
    # From the root directory
    pnpm install
    # Navigate to backend and frontend to ensure all deps are installed if needed
    cd backend && pnpm install
    cd ../frontend && pnpm install
    cd ..
    ```
4.  **Generate Protobuf Code (if needed):**
    ```bash
    buf generate
    ```

### Running Locally

1.  **Start the backend worker (using Wrangler):**
    ```bash
    cd backend
    pnpm run dev
    ```
2.  **Start the frontend development server:**
    ```bash
    cd frontend
    pnpm run dev
    ```

The application should now be accessible (usually at `http://localhost:5173` based on the frontend README).

## Deployment

*(Instructions need to be added here, likely involving running the `deploy.sh` script or using `wrangler deploy`.)*

```bash
# Example deployment command (adapt as needed)
./deploy.sh
# or
# cd backend && wrangler deploy
```

## Contributing

*(Add guidelines for contributing if this is an open-source project).*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 