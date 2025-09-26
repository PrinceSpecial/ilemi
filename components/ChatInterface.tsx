/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Home,
  Compass,
  Send,
  RotateCw,
  Menu,
  X,
  Mic,
  Bot,
  Loader2,
  Square,
} from "lucide-react";
import { chatbotConfig } from "@/lib/config";
import { Profanity } from "@2toad/profanity";
import DocumentUploadModal from "./DocumentUploadModal";
import { MessageContentRenderer } from "./ui/MessageContentRenderer";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { synthesizeSpeechFromText } from "@/lib/services/audioClient";

type ChatMessagePart =
  | { type: 'text'; text: string }
  | { type: 'audio'; audioUrl: string };

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: ChatMessagePart[];
};

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, date: string}>>([]);
  const [activeSession, setActiveSession] = useState<string>("current");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: chatbotConfig.welcomeMessage,
      parts: [{ type: "text", text: chatbotConfig.welcomeMessage }],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const lastMessageTime = useRef(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("AIChatMessages");
      const savedSessions = localStorage.getItem("AIChatSessions");
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 1) {
          setMessages(parsedMessages);
        }
      }
      
      if (savedSessions) {
        setChatSessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, [setMessages]);

  // Save chat history
  useEffect(() => {
    try {
      if (messages.length > 1) {
        localStorage.setItem("AIChatMessages", JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [messages]);

  const validateMessage = (text: string): boolean => {
    const profanity = new Profanity();
    profanity.addWords(["casino", "gambling", "poker", "bet"]);
    profanity.removeWords([""]);

    return (
      text.length <= 1000 && 
      !/(.)\1{6,}/i.test(text) && 
      !profanity.exists(text)
    );
  };

  const extractAssistantMessageText = (content: string): string | null => {
    if (!content) {
      return null;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
        return parsed.message;
      }
    } catch {
      // Ignore JSON parse errors and fall back to plain text
    }

    return trimmed;
  };

  const sendMessageWithThrottle = async (
    text: string,
    options?: { voiceNoteAudioUrl?: string }
  ) => {
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime.current;

    if (timeSinceLastMessage < chatbotConfig.rateLimit.minTimeBetweenMessages) {
      return;
    }

    if (isRateLimited) {
      return;
    }

    if (!validateMessage(text)) {
      setValidationError("Message blocked - inappropriate/spam");
      setTimeout(() => setValidationError(null), 5000);
      return;
    }

    lastMessageTime.current = now;
    setIsLoading(true);
    setVoiceError(null);

    try {
      // Ajouter le message utilisateur
      const userMessageParts: ChatMessagePart[] = [
        { type: "text", text }
      ];

      if (options?.voiceNoteAudioUrl) {
        userMessageParts.push({ type: "audio", audioUrl: options.voiceNoteAudioUrl });
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: text,
        parts: userMessageParts,
      };

      setMessages(prev => [...prev, userMessage]);

      // Créer un message assistant temporaire pour le streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: "",
        parts: [{ type: "text", text: "" }]
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Préparer l'historique pour l'API
      // Utiliser l'état actuel + le nouveau message utilisateur
      const currentMessages = [...messages, userMessage]; // Ajouter le message utilisateur aux messages existants
      const chatHistory = currentMessages
        .filter(msg => msg.id !== "welcome") // Exclure seulement le message de bienvenue
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Appeler l'API LangChain avec streaming
      console.log("📤 Sending to API:", { messages: chatHistory });
      const response = await fetch('/api/langchain/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      // Gérer le streaming de la réponse
      console.log("📡 Starting to read stream...");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log("📦 Raw chunk received:", chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                console.log("🔍 Parsed data:", parsed);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  console.log("📝 Accumulated content:", accumulatedContent);

                  // Mettre à jour le message en temps réel
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          parts: [{ type: "text", text: accumulatedContent }]
                        }
                      : msg
                  ));
                }
              } catch (e) {
                // Ignorer les erreurs de parsing JSON
              }
            }
          }
        }

        const assistantSpeechText = extractAssistantMessageText(accumulatedContent);
        if (assistantSpeechText) {
          try {
            const { audioUrl } = await synthesizeSpeechFromText(assistantSpeechText);
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    parts: [
                      { type: "text", text: accumulatedContent },
                      { type: "audio", audioUrl },
                    ],
                  }
                : msg
            ));
          } catch (error) {
            // console.error('Erreur lors de la synthèse audio:', error);
            // setVoiceError((prev) =>
            //   prev ?? "Impossible de générer la réponse audio."
            // );
          }
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de l'appel à l'agent:", error);

      // Gestion des erreurs
      const isValidationError =
        error.message?.includes("400") ||
        error.message?.toLowerCase().includes("invalid or suspicious");

      if (isValidationError) {
        setValidationError(
          "Message blocked (inappropriate content, spam, or exceeding length)"
        );
        setTimeout(() => setValidationError(null), 5000);
        return;
      }

      const isRateLimit =
        error.message?.includes("429") ||
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("too many requests");

      if (isRateLimit) {
        setIsRateLimited(true);
        setRateLimitCountdown(chatbotConfig.rateLimit.interval);

        setTimeout(() => {
          setIsRateLimited(false);
          setRateLimitCountdown(null);
        }, chatbotConfig.rateLimit.interval * 1000);
      } else {
        setRateLimitCountdown(5);
        setTimeout(() => setRateLimitCountdown(null), 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isRateLimited && input.length <= chatbotConfig.rateLimit.maxMessageLength) {
      sendMessageWithThrottle(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const {
    isRecording: isVoiceRecording,
    isProcessing: isVoiceProcessing,
    errorMessage: recorderError,
    startRecording,
    stopRecording,
    setErrorMessage: setRecorderError,
  } = useVoiceRecorder({
    onTranscription: async ({ text, audioDataUrl }) => {
      const cleanedText = text.trim();
      if (!cleanedText) {
        setVoiceError("La transcription n'a retourné aucun texte exploitable.");
        return;
      }

      setVoiceError(null);

      try {
        await sendMessageWithThrottle(cleanedText, {
          voiceNoteAudioUrl: audioDataUrl,
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de la note vocale:", error);
        setVoiceError("Impossible d'envoyer la note vocale. Veuillez réessayer.");
      }
    },
    onError: (error) => {
      setVoiceError(error.message);
    },
  });

  useEffect(() => {
    if (recorderError) {
      setVoiceError(recorderError);
    }
  }, [recorderError]);

  const startNewConversation = () => {
    const currentDate = new Date().toLocaleDateString();
    const newSession = {
      id: Date.now().toString(),
      title: `Chat ${chatSessions.length + 1}`,
      date: currentDate
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession.id);
    clearMessages();
  };

  const clearMessages = () => {
    setIsRateLimited(false);
    setRateLimitCountdown(null);
    setVoiceError(null);
    localStorage.removeItem("AIChatMessages");
    
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: chatbotConfig.welcomeMessage,
        parts: [
          {
            type: "text",
            text: chatbotConfig.welcomeMessage,
          },
        ],
      },
    ]);
  };

  const handleConversationChoice = (choice: string) => {
    if (!isRateLimited) {
      sendMessageWithThrottle(choice);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log("Fichier uploadé:", file.name);

      // Injecter localement le ProcessContainer pour indiquer que l'analyse démarre
      setMessages(prev => [
        ...prev,
        {
          id: `proc-${Date.now()}`,
          role: 'assistant' as const,
          content: JSON.stringify({
            message: "J'ai reçu votre document. Démarrage de l'analyse de votre parcelle...",
            uiComponents: [
              { component: 'ProcessContainer', props: {} }
            ]
          }),
          parts: [{ type: 'text', text: JSON.stringify({
            message: "J'ai reçu votre document. Démarrage de l'analyse de votre parcelle...",
            uiComponents: [ { component: 'ProcessContainer', props: {} } ]
          }) }]
        }
      ]);

      // Poster le fichier vers l'API serveur qui exécute le workflow
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch('/api/parcel-analysis', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status}: ${txt}`);
      }

      const payload = await resp.json();
      const result = payload.report;

      // Injecter localement le ReportContainer avec le résultat
      setMessages(prev => [
        ...prev,
        {
          id: `report-${Date.now()}`,
          role: 'assistant' as const,
          content: JSON.stringify({
            message: "Voici les résultats de l'analyse de votre parcelle :",
            uiComponents: [
              { component: 'ReportContainer', props: { reportData: result } }
            ]
          }),
          parts: [{ type: 'text', text: JSON.stringify({
            message: "Voici les résultats de l'analyse de votre parcelle :",
            uiComponents: [ { component: 'ReportContainer', props: { reportData: result } } ]
          }) }]
        },
        {
          id: `info-${Date.now()+1}`,
          role: 'assistant' as const,
          content: `Un rapport d'analyse foncière a été généré. La parcelle fait ${result.summary?.totalArea ? Number(result.summary.totalArea).toFixed(2) : 'N/A'} ha et intersecte avec ${result.layers?.length || 0} couches de données. Vous pouvez maintenant poser des questions sur ce rapport.`,
          parts: [{ type: 'text', text: `Un rapport d'analyse foncière a été généré. La parcelle fait ${result.summary?.totalArea ? Number(result.summary.totalArea).toFixed(2) : 'N/A'} ha et intersecte avec ${result.layers?.length || 0} couches de données. Vous pouvez maintenant poser des questions sur ce rapport.` }]
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'upload et du traitement du fichier :', error);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant' as const,
          content: 'Désolé, une erreur est survenue lors du traitement du fichier. Veuillez réessayer.',
          parts: [{ type: 'text', text: 'Désolé, une erreur est survenue lors du traitement du fichier. Veuillez réessayer.' }]
        }
      ]);
    }
  };

  const handleOpenUploadModal = () => {
    setUploadModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt={chatbotConfig.name}
              className="h-10"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={startNewConversation}
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 pb-4">
          <nav className="space-y-1">
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </a>
            <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 w-full text-left">
              <Compass className="w-4 h-4" />
              <span>Vérifier ma parcelle</span>
            </button>
          </nav>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Conversations récentes</h2>
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  activeSession === session.id ? 'bg-gray-100 border-l-2 border-black' : ''
                }`}
              >
                <div className="text-sm font-medium text-black truncate">{session.title}</div>
                <div className="text-xs text-gray-500">{session.date}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-black">
                {chatbotConfig.ui.windowTitle}
              </h1>
            </div>
          </div>
          <Button onClick={clearMessages} variant="ghost" size="sm">
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-full lg:max-w-none mx-auto px-4 py-8 pb-32">
            {messages.map((message) => {
              // Handle both old and new message formats
              const messageData = message as any;
              const isUser = messageData.role === 'user';
              const messageContent = messageData.content || '';
              
              return (
                <div key={message.id} className={`mb-8 ${isUser ? 'flex justify-end' : ''}`}>
                  <div className={`flex space-x-4 max-w-full lg:max-w-none ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 mt-1 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div className={`flex-1 ${isUser ? 'bg-black text-white rounded-xl px-4 py-2' : ''}`}>
                      {message.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <MarkdownWithButtons
                              key={`${message.id}-${i}`}
                              onConversationChoice={handleConversationChoice}
                              onLinkClick={handleLinkClick}
                              isRateLimited={isRateLimited}
                              isLoading={isLoading}
                              isUser={isUser}
                            >
                              {part.text}
                            </MarkdownWithButtons>
                          );
                        }
                        if (part.type === "audio") {
                          return (
                            <div
                              key={`${message.id}-${i}-audio`}
                              className="mt-2 flex flex-col gap-1"
                            >
                              <audio
                                controls
                                preload="auto"
                                src={part.audioUrl}
                                className="w-full"
                              />
                              <span className="text-[11px] text-gray-500">
                                Note vocale
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }) || (
                        <MarkdownWithButtons
                          onConversationChoice={handleConversationChoice}
                          onLinkClick={handleLinkClick}
                          isRateLimited={isRateLimited}
                          isLoading={isLoading}
                          isUser={isUser}
                        >
                          {messageContent || ""}
                        </MarkdownWithButtons>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="mb-8">
                <div className="flex space-x-4 max-w-full lg:max-w-none">
                  <div className="w-8 h-8 mt-1 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1 items-center py-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="fixed bottom-6 left-1/2 lg:left-[calc(50%+160px)] transform -translate-x-1/2 z-10">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-2 max-w-2xl w-full mx-4">
            {/* Error Messages */}
            {validationError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {validationError}
              </div>
            )}
            
            {isRateLimited && (
              <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-xs">
                {rateLimitCountdown !== null && rateLimitCountdown > 0
                  ? `Rate limit exceeded. Please wait ${rateLimitCountdown} second${rateLimitCountdown !== 1 ? 's' : ''}...`
                  : "Rate limit exceeded. Please wait..."
                }
              </div>
            )}

            {(isVoiceRecording || isVoiceProcessing || voiceError) && (
              <div className="mb-2 text-xs space-y-1">
                {isVoiceRecording && (
                  <span className="text-red-600">
                    Enregistrement en cours... appuyez à nouveau pour arrêter.
                  </span>
                )}
                {isVoiceProcessing && (
                  <span className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Transcription de votre note vocale...
                  </span>
                )}
                {voiceError && (
                  <span className="text-red-600">{voiceError}</span>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
              {/* Add File Button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="flex-shrink-0 rounded-full"
                onClick={handleOpenUploadModal}
              >
                <Plus className="w-5 h-5" />
              </Button>

              {/* Text Input */}
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRateLimited ? "Rate limited, please wait..." : chatbotConfig.ui.inputPlaceholder}
                  disabled={isRateLimited}
                  className="resize-none min-h-[44px] max-h-32 border-0 focus:ring-0 focus:border-0 bg-transparent p-2"
                  rows={1}
                />
              </div>

              {/* Voice Note Button */}
              <Button
                type="button"
                size="icon"
                variant={isVoiceRecording ? "default" : "ghost"}
                className={`flex-shrink-0 rounded-full ${isVoiceRecording ? 'bg-red-50 text-red-600' : ''}`}
                disabled={isRateLimited || isLoading || isVoiceProcessing}
                aria-pressed={isVoiceRecording}
                onClick={() => {
                  if (isVoiceRecording) {
                    stopRecording();
                  } else {
                    setRecorderError(null);
                    setVoiceError(null);
                    startRecording();
                  }
                }}
              >
                {isVoiceProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isVoiceRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isRateLimited || isLoading}
                className="flex-shrink-0 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}

const MarkdownWithButtons = ({
  children,
  onConversationChoice,
  onLinkClick,
  isRateLimited,
  isLoading,
  isUser = false,
}: {
  children: string;
  onConversationChoice: (choice: string) => void;
  onLinkClick: (url: string) => void;
  isRateLimited: boolean;
  isLoading: boolean;
  isUser?: boolean;
}) => {
  const conversationChoiceRegex = /\{\{choice:([^}]+)\}\}/g;
  const linkButtonRegex = /\{\{link:([^|]+)\|([^}]+)\}\}/g;
  const conversationChoices: string[] = [];
  const linkButtons: { url: string; label: string }[] = [];

  // Detect and handle structured JSON content
  let contentForRenderer = children;
  let textForButtons = children;

  try {
    const parsed = JSON.parse(children);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      // Extract buttons from the message field
      const messageText: string = parsed.message || '';

      let m;
      while ((m = conversationChoiceRegex.exec(messageText)) !== null) {
        conversationChoices.push(m[1].trim());
      }
      while ((m = linkButtonRegex.exec(messageText)) !== null) {
        linkButtons.push({ url: m[1].trim(), label: m[2].trim() });
      }

      // Clean the tokens from the message before rendering
      const cleanedMessage = messageText
        .replace(conversationChoiceRegex, '')
        .replace(linkButtonRegex, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      const cleanedPayload = { ...parsed, message: cleanedMessage };
      contentForRenderer = JSON.stringify(cleanedPayload);
      textForButtons = cleanedMessage;
    }
  } catch {
    // Not JSON; fall back to plain text handling below
  }

  // For non-JSON content, extract tokens directly from the text
  if (contentForRenderer === children) {
    let match;
    while ((match = conversationChoiceRegex.exec(children)) !== null) {
      conversationChoices.push(match[1].trim());
    }
    while ((match = linkButtonRegex.exec(children)) !== null) {
      linkButtons.push({ url: match[1].trim(), label: match[2].trim() });
    }

    const cleanMarkdown = children
      .replace(conversationChoiceRegex, '')
      .replace(linkButtonRegex, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    contentForRenderer = cleanMarkdown;
    textForButtons = cleanMarkdown;
  }

  return (
    <div>
      <div className={`prose max-w-none ${isUser ? 'prose-invert' : ''}`}>
        <MessageContentRenderer
          content={contentForRenderer}
          onActionClick={(action) => {
            // Gérer les actions des composants UI ici
            console.log('UI Action clicked:', action);
          }}
        />
      </div>
      {(conversationChoices.length > 0 || linkButtons.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {conversationChoices.map((choice, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onConversationChoice(choice)}
              disabled={isRateLimited || isLoading}
              className="text-sm rounded-full"
            >
              {choice}
            </Button>
          ))}
          {linkButtons.map((button, index) => (
            <Button
              key={index}
              variant="default"
              size="sm"
              onClick={() => onLinkClick(button.url)}
              className="text-sm rounded-full"
            >
              {button.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};