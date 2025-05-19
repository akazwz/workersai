# Cloudflare AI Chat Demo

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/akazwz/workersai/tree/main/backend)

Live Demo: [workersai.zwz.workers.dev](https://workersai.zwz.workers.dev/)

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
    git clone https://github.com/akazwz/workersai.git
    cd workersai
    ```
2.  **Install Dependencies:**
    ```bash
    # From the root directory
    pnpm install
    # Navigate to backend and frontend to ensure all deps are installed if needed
    cd backend && pnpm install
    cd ../frontend && pnpm install
    cd ..
    ```
3.  **Configure Backend Environment Variables:**
    *   Navigate to the `backend` directory.
    *   Copy the example environment file: `cp .dev.vars.example .dev.vars`
    *   Edit `.dev.vars` and fill in your Cloudflare credentials and bindings (refer to `wrangler.jsonc` for required variables).
4.  **Build Frontend Assets:**
    ```bash
    cd frontend
    pnpm run build
    cd ..
    ```
5.  **Configure Cloudflare Resources:**
    *   Set up necessary Cloudflare resources (KV namespace, Durable Object binding, AI Gateway). This step might involve using the Cloudflare dashboard or Wrangler commands. Ensure the bindings in `backend/wrangler.jsonc` and `.dev.vars` match these resources.
6.  **Generate Protobuf Code (if needed):**
    ```bash
    buf generate
    ```

### Running Locally

**Important:** Before starting the backend worker, you **must** build the frontend assets. This is done in **Setup step 4**:
```bash
# Ensure you are in the project root directory
cd frontend
pnpm run build
cd ..
```
This step is crucial for the backend to serve static assets correctly and to prevent startup errors. Also, ensure you have configured your `backend/.dev.vars` file as per **Setup step 3**.

1.  **Start the backend worker (using Wrangler):**
    ```bash
    cd backend
    pnpm run dev
    ```
2.  **Start the frontend development server (optional, if you want to make frontend changes and see them live):**
    ```bash
    cd frontend
    pnpm run dev
    ```

The application should now be accessible (usually at `http://localhost:8787` for the backend worker, which serves the frontend assets. If you run the frontend dev server, it's often at `http://localhost:5173`).

## Deployment

*(Instructions need to be added here, likely involving running the `deploy.sh` script or using `wrangler deploy`.)*

```bash
# Example deployment command (adapt as needed)
./deploy.sh
# or
# cd backend && wrangler deploy
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 