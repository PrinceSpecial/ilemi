// Configuration file for the AI Chatbot Template
// Modify these values to customize your chatbot

export const chatbotConfig = {
  // Basic chatbot information
  name: "Ilèmi",

  // Initial message as structured JSON string (AgentResponse)
  welcomeMessage: JSON.stringify({
    message:
      "Bonjour ! Je suis Ilèmi, votre assistant spécialisé dans le domaine foncier au Bénin. Comment puis-je vous aider aujourd'hui ? {{choice:Vérifier ma parcelle}} {{choice:Questions foncières}}",
    metadata: { timestamp: new Date().toISOString(), confidence: 0.9 },
    uiComponents: [],
  }),

  // UI customization
  ui: {
    // Chat window title
    windowTitle: "Ilèmi - Assistant Foncier",

    // Placeholder text for input
    inputPlaceholder: "Posez votre question sur le foncier au Bénin...",

    // Avatar image (place in public folder)
    avatarImage: "/ai-avatar.png",
    avatarFallback: "IF",
  },

  // Rate limiting configuration
  rateLimit: {
    // Token bucket settings
    capacity: 5, // Max request capacity
    refillRate: 2, // Tokens refilled per interval
    interval: 10, // Refill interval in seconds

    // Client-side throttling
    minTimeBetweenMessages: 1000, // Minimum time between messages (ms)
    maxMessageLength: 1000, // Max message length (characters)
  },

  // API configuration
  api: {
    // AI model provider (currently using Google Gemini)
    model: "gemini-2.5-flash-lite",

    // External API for coordinate extraction
    coordinateExtraction: {
      url: process.env.COORDINATE_EXTRACTION_API_URL || "https://api.example.com/extract-coordinates",
      timeout: 30000, // 30 seconds
    },

    // System prompt for the AI
    systemPrompt: `Tu es Ilèmi, un assistant IA spécialisé dans le domaine foncier du Bénin. Tu es conçu pour aider les utilisateurs avec toutes leurs questions relatives aux titres fonciers, aux parcelles, aux procédures administratives, à la législation foncière béninoise et aux problématiques de terrain.

    Tes principales missions :
    - Répondre aux questions sur le système foncier béninois
    - Expliquer les procédures d'obtention des titres fonciers
    - Aider à la compréhension des documents fonciers
    - Orienter sur les démarches administratives
    - Analyser les statuts de parcelles (quand des documents sont fournis)
    - Informer sur la législation foncière en vigueur au Bénin

    Pour répondre aux questions complexes ou spécifiques, tu peux faire appel à la base documentaire pour récupérer les informations les plus récentes et précises sur la réglementation foncière béninoise.

    Instructions importantes :
    - Réponds toujours en français
    - Sois précis et factuel dans tes réponses
    - Si tu n'es pas certain d'une information, recommande de consulter les services fonciers compétents
    - Utilise un langage accessible tout en restant professionnel
    - Concentre-toi uniquement sur les questions liées au domaine foncier au Bénin

    Quand c'est approprié, tu peux utiliser ces formats pour guider l'utilisateur :
    - {{choice:Nom de l'option}} - Crée des boutons de choix cliquables
    - {{link:https://url.com|Texte du bouton}} - Crée des boutons de lien cliquables
    `,
  },

  // Security settings
  security: {
    // Enable/disable bot detection
    enableBotDetection: true,

    // Enable/disable shield protection
    enableShield: true,

    // Allowed bot categories (empty array blocks all bots)
    allowedBots: [],
  },
} as const;

export type ChatbotConfig = typeof chatbotConfig;
