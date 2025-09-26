# AI Chatbot Development Guide

## Project Overview
This is a Next.js 15 AI chatbot application built with:
- **Framework**: Next.js 15 with App Router and Turbopack
- **AI Integration**: Vercel AI SDK with Google Gemini
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Security**: Arcjet for rate limiting and bot protection
- **Package Manager**: pnpm
- **TypeScript**: Strict mode enabled

## Dev Environment Setup

### Prerequisites
- Node.js 18+ 
- pnpm (preferred package manager)
- Git

### Environment Variables
Create `.env.local` with:
```bash
ARCJET_KEY=your_arcjet_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_APP_URL=localhost  # or your deployed URL
```

### Quick Start Commands
```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Development Best Practices

### File Structure & Organization
- **App Directory**: Use Next.js 15 App Router structure
- **Components**: Organize in `/components` with sub-folders for UI elements
- **API Routes**: Place in `/app/api` following App Router conventions
- **Utilities**: Keep shared utilities in `/lib`
- **Types**: Define TypeScript interfaces near their usage or in dedicated type files

### Code Quality Standards
- **TypeScript**: Maintain strict TypeScript configuration
- **ESLint**: Follow Next.js recommended ESLint rules
- **Path Aliases**: Use `@/*` for absolute imports from project root
- **Component Structure**: Prefer server components by default, use 'use client' only when needed

### Next.js Specific Guidelines
- Use Next.js 15 App Router patterns consistently
- Leverage Server Components for better performance
- Implement proper loading states and error boundaries
- Use Next.js built-in optimizations (Image, Link, etc.)
- Follow React 19 patterns and hooks

## Testing & Quality Assurance

### Pre-commit Checklist
```bash
# Type checking
npx tsc --noEmit

# Linting and formatting
pnpm lint

# Build verification
pnpm build
```

### Component Testing Guidelines
- Test user interactions and AI chat functionality
- Mock external API calls (Google AI, Arcjet)
- Test edge cases like rate limiting and content filtering
- Verify responsive design on different screen sizes

### Integration Testing
- Test API routes in `/app/api/chat`
- Verify Arcjet rate limiting functionality
- Test AI model integration and error handling
- Validate environment variable configuration

## Security & Performance

### Security Considerations
- Always validate user input before sending to AI model
- Implement proper rate limiting with Arcjet
- Use content filtering for inappropriate messages
- Sanitize and validate all user-generated content
- Keep API keys secure and never commit them

### Performance Optimization
- Use Next.js Server Components where possible
- Implement proper loading states for AI responses
- Optimize bundle size with dynamic imports
- Monitor Core Web Vitals
- Use Next.js built-in caching strategies

## Deployment Guidelines

### Environment Setup
- Configure production environment variables
- Set up proper domain in `NEXT_PUBLIC_APP_URL`
- Ensure API keys are properly configured
- Test rate limiting in production environment

### Deployment Checklist
- [ ] All environment variables configured
- [ ] Build passes without errors
- [ ] TypeScript compilation successful
- [ ] ESLint checks pass
- [ ] API endpoints tested
- [ ] AI model integration verified
- [ ] Rate limiting functionality confirmed

## Troubleshooting Common Issues

### Development Issues
- **Turbopack Issues**: Try `pnpm dev --no-turbo` if you encounter build problems
- **TypeScript Errors**: Check path aliases and module resolution
- **AI API Errors**: Verify API key configuration and quota limits
- **Rate Limiting**: Test with different IP addresses or adjust Arcjet rules

### Production Issues
- **Build Failures**: Check for missing environment variables
- **Runtime Errors**: Monitor API response times and error rates
- **Performance**: Use Next.js Analytics to identify bottlenecks

## Contributing Guidelines

### Pull Request Format
- **Title**: `[feature/fix]: Brief description`
- **Description**: Include context, changes made, and testing done
- **Checklist**: Ensure all quality checks pass

### Code Review Standards
- Verify TypeScript strict mode compliance
- Check for proper error handling
- Ensure security best practices
- Validate accessibility standards
- Test on different devices and browsers

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-chat-feature

# Make changes and commit
git add .
git commit -m "feat: add new chat feature"

# Push and create PR
git push origin feature/new-chat-feature
```

## Additional Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Arcjet Documentation](https://docs.arcjet.com)
- [Radix UI Components](https://radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com/docs)