# AI Chatbot Codebase Guide

## Architecture Overview
- **Next.js 15** with App Router and Turbopack for fast development
- **Vercel AI SDK** + Google Gemini for streaming chat responses
- **Arcjet** for configurable rate limiting, bot detection, and security shield
- **Radix UI** + Tailwind CSS for accessible, customizable components
- **TypeScript strict mode** with path aliases (`@/*`)

## Key Files & Patterns

### Configuration
- `lib/config.ts` - Central configuration for chatbot behavior, UI, security, and API settings
- Environment variables: `ARCJET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `NEXT_PUBLIC_APP_URL`

### API Integration
- `app/api/chat/route.ts` - Streaming chat endpoint with Arcjet protection and content validation
- Uses token bucket rate limiting configured in `lib/config.ts`
- Content validation: profanity filtering, length limits, spam detection

### Component Structure
- `components/Chatbot.tsx` - Main client component with chat state management
- `components/ai-elements/` - Chat-specific components (conversation, message, prompt-input)
- `components/ui/` - Reusable Radix UI components with `class-variance-authority` variants
- `lib/utils.ts` - `cn()` utility for Tailwind class merging

### AI Response Syntax
Use `{{choice:Option Name}}` for interactive choice buttons and `{{link:url|Button Text}}` for clickable links in AI responses.

## Development Workflow
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Production build
- `pnpm lint` - ESLint with Next.js rules
- Requires `.env.local` with API keys before running

## Security & Validation
- Arcjet rules configured via `lib/config.ts` (enable/disable bot detection, shield, rate limits)
- Client-side throttling: 1s minimum between messages, 1000 char limit
- Profanity filtering with customizable word lists
- CSRF protection via referer validation

## UI Patterns
- Use `cva()` for component variants in `components/ui/`
- Client components marked with `"use client"` directive
- Framer Motion for animations, React Markdown for message rendering
- Mobile-responsive with scroll locking on chat open

## Common Tasks
- Customize chatbot in `lib/config.ts` (name, welcome message, UI settings)
- Add new UI variants in `components/ui/` following existing patterns
- Modify AI behavior via system prompt in config
- Extend security rules in `lib/arcjet.ts` or config