# Ilèmi - AI Chatbot for Land Administration

A specialized AI chatbot for land administration in Benin, built with Next.js 15 and powered by Google Gemini AI.

## Features

- 🤖 **Intelligent AI Assistant** - Specialized in land administration queries for Benin
- 🗺️ **Geospatial Analysis** - Parcel analysis with coordinate extraction and mapping
- 📄 **Document Processing** - Upload and analyze land documents
- 🔒 **Security First** - Arcjet protection with rate limiting and bot detection
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎙️ **Voice Support** - Audio recording and transcription capabilities
- 🌍 **Multilingual** - Optimized for French language interactions

## Tech Stack

- **Framework**: Next.js 15 with App Router & Turbopack
- **AI Integration**: Vercel AI SDK + Google Gemini
- **UI Components**: Radix UI + Tailwind CSS
- **Security**: Arcjet for rate limiting & protection
- **Database**: LibSQL for embeddings
- **Maps**: MapLibre GL for geospatial visualization
- **Language**: TypeScript with strict mode

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-chatbot

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

```bash
ARCJET_KEY=your_arcjet_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_APP_URL=localhost
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (chat, audio, documents)
│   └── chat/              # Chat interface page
├── components/            # React components
│   ├── ai-elements/       # Chat-specific components
│   ├── landing/           # Landing page components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── langchain/         # LangChain integration
│   └── services/          # Service layer
├── public/                # Static assets and data files
└── scripts/               # Database and utility scripts
```

## Key Features

### Land Administration Specialization
- Parcel verification and analysis
- Land document processing
- Geospatial coordinate extraction
- Legal compliance checking

### AI-Powered Interactions
- Context-aware responses
- Document understanding
- Interactive choice buttons
- Clickable links in responses

### Security & Performance
- Configurable rate limiting
- Content filtering
- Bot protection
- Optimized for production

## Configuration

Customize the chatbot behavior in `lib/config.ts`:

```typescript
export const chatbotConfig = {
  name: "Ilèmi",
  welcomeMessage: "...",
  ui: {
    windowTitle: "Ilèmi - Assistant Foncier",
    inputPlaceholder: "Posez votre question...",
  },
  // ... more options
}
```

## Deployment

The application is optimized for deployment on Vercel, but can be deployed on any platform supporting Next.js.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

For questions or support, please open an issue in the repository.