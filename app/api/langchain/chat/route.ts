import { aj, getRateLimitHeaders } from "@/lib/arcjet";
import { headers } from "next/headers";
import { Profanity } from "@2toad/profanity";
import { runAgent } from "@/lib/langchain/agent";

export const maxDuration = 30;

const profanity = new Profanity();
profanity.addWords(["casino", "gambling", "poker", "bet"]);
profanity.removeWords([""]); // remove words from filter if needed

// content validation (disallow empty msg, urls, spam, and profanity)
const validateMessages = (messages: Array<{role: string, content: string}>): boolean => {
  if (!messages?.length) return false;

  // Validate last message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") return true;

  const content = JSON.stringify(lastMessage);
  return (
    content.length <= 1000 &&
    !/(.)\1{6,}/i.test(content) &&
    !profanity.exists(content)
  );
};

export async function POST(req: Request) {
  try {
    console.log("🚀 API Request received");

    // TODO: Initialiser le cache documentaire avec le nouveau vector store
    // await initializeDocumentCache();

    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    console.log("Referer:", referer);
    console.log("🔍 API Request received");
    console.log("Referer:", referer);
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);

    // Check referer (basic CSRF protection)
    const expectedReferer = process.env.NEXT_PUBLIC_APP_URL || "localhost";
    if (!referer.includes(expectedReferer)) {
      console.log("❌ Referer check failed:", { referer, expectedReferer });
      return new Response("Forbidden - Invalid referer", { status: 403 });
    }
    console.log("✅ Referer check passed");

    // Use Arcjet for bot protection and rate limiting
    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return new Response(
          "Too many requests. Please wait before sending another message.",
          {
            status: 429,
            headers: getRateLimitHeaders(decision),
          }
        );
      } else if (decision.reason.isBot()) {
        return new Response("Access denied - Bot detected", { status: 403 });
      } else {
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Parse and validate request body
    const { messages }: { messages: Array<{role: string, content: string}> } = await req.json();
    console.log("📨 Received messages:", messages);

    // Validate messages
    if (!validateMessages(messages)) {
      console.log("❌ Message validation failed");
      return new Response("Invalid or suspicious message content", {
        status: 400,
      });
    }

    // Initialize LangChain agent with tools
    // L'agent utilise maintenant l'OutputParser pour des réponses structurées

    // Create streaming response
    const response = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            console.log("🤖 Executing agent with structured output...");

            // Extraire le dernier message utilisateur et l'historique
            const lastMessage = messages[messages.length - 1];
            const chatHistory = messages.slice(0, -1);

            const result = await runAgent(lastMessage.content, chatHistory);

            console.log("✅ Agent execution complete, structured response:", {
              messageLength: result.message.length,
              uiComponentsCount: result.uiComponents?.length || 0,
              hasMetadata: !!result.metadata
            });

            // Envoyer la réponse structurée JSON (enveloppée pour compatibilité frontend)
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: JSON.stringify(result) })}\n\n`));

            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("❌ Agent execution error:", error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          ...getRateLimitHeaders(decision),
        },
      }
    );

    return response;
  } catch (error: unknown) {
    console.error("Error in LangChain chat API:", error);

    // Handle specific error types
    if (error instanceof Error && error.name === "SyntaxError") {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}