import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { aj, getRateLimitHeaders } from "@/lib/arcjet";
import { chatbotConfig } from "@/lib/config";
import { headers } from "next/headers";
import { Profanity } from "@2toad/profanity";

export const maxDuration = 30;

const profanity = new Profanity();
profanity.addWords(["casino", "gambling", "poker", "bet"]);
profanity.removeWords([""]); // remove words from filter if needed, current list at https://github.com/2Toad/Profanity/blob/main/src/data/profane-words.ts

// content validation (disallow empty msg, urls, spam, and profanity)
const validateMessages = (messages: UIMessage[]): boolean => {
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
    const headersList = await headers();
    const referer = headersList.get("referer") || "";

    // Check referer (basic CSRF protection)
    if (!referer.includes(process.env.NEXT_PUBLIC_APP_URL || "localhost")) {
      return new Response("Forbidden - Invalid referer", { status: 403 });
    }

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
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Validate messages
    if (!validateMessages(messages)) {
      return new Response("Invalid or suspicious message content", {
        status: 400,
      });
    }

    // Process the chat request
    const result = streamText({
      model: google(chatbotConfig.api.model),
      messages: convertToModelMessages(messages),
      system: chatbotConfig.api.systemPrompt,
    });

    // Return the streaming response with rate limit headers
    const response = result.toUIMessageStreamResponse();

    // Add rate limit headers to the response if available
    const rateLimitHeaders = getRateLimitHeaders(decision);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    // Handle specific error types
    if (error instanceof Error && error.name === "SyntaxError") {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
