# 1. Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the source code
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NODE_ENV
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG ARCJET_KEY
ARG COORDINATE_EXTRACTION_API_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NODE_ENV=${NODE_ENV}
ENV GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
ENV ARCJET_KEY=${ARCJET_KEY}
ENV COORDINATE_EXTRACTION_API_URL=${COORDINATE_EXTRACTION_API_URL}


# Compile next.config.ts to next.config.js
RUN npx tsc --project tsconfig.build.json --outDir dist

# Build the Next.js application
RUN pnpm run build

# 2. Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ARG NEXT_PUBLIC_APP_URL
ARG NODE_ENV
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG ARCJET_KEY
ARG COORDINATE_EXTRACTION_API_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NODE_ENV=${NODE_ENV}
ENV GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
ENV ARCJET_KEY=${ARCJET_KEY}
ENV COORDINATE_EXTRACTION_API_URL=${COORDINATE_EXTRACTION_API_URL}

# Copy the built application files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the compiled next.config.js
COPY --from=builder /app/dist/next.config.js ./next.config.js

# Expose port
EXPOSE 3000

# Install production dependencies using pnpm
RUN pnpm install --prod

# Start the app
CMD ["pnpm", "start"]
