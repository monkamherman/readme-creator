"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { CHAT_QUERY } from "@/lib/api/graphql/queries/chatWithRider/index";
import { SUBSCRIPTION_NEW_MESSAGE } from "@/lib/api/graphql/subscription/ChatWithRider";
import { SEND_CHAT_MESSAGE } from "@/lib/api/graphql/mutations/chatWithRider";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  status?: "sending" | "sent" | "error";
}

interface RealTimeChatProps {
  orderId: string;
  currentUserId: string;
  currentUserName?: string;
  riderName?: string;
  onNewMessage?: (message: Message) => void;
  onClose?: () => void;
  className?: string;
}

export function RealTimeChat({
  orderId,
  currentUserId,
  currentUserName = "Vous",
  riderName = "Livreur",
  onNewMessage,
  onClose,
  className = "",
}: RealTimeChatProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Audio notification not available");
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: `chat-${orderId}`,
        requireInteraction: false,
      });
    }
  }, [orderId]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Query for chat history
  const { data: chatData, loading: chatLoading } = useQuery(CHAT_QUERY, {
    variables: { order: orderId },
    fetchPolicy: "network-only",
    onError: (error) => console.error("Error loading chat:", error),
  });

  // Subscribe to new messages
  const { data: subscriptionData } = useSubscription(SUBSCRIPTION_NEW_MESSAGE, {
    variables: { order: orderId },
  });

  // Send message mutation
  const [sendChatMessage, { loading: sendingMessage }] = useMutation(SEND_CHAT_MESSAGE, {
    onError: (error) => {
      console.error("Error sending message:", error);
      // Mark message as error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.status === "sending" ? { ...msg, status: "error" as const } : msg
        )
      );
    },
  });

  // Load chat history
  useEffect(() => {
    if (chatData?.chat) {
      const formattedMessages: Message[] = chatData.chat.map((message: any) => ({
        id: message.id,
        text: message.message,
        createdAt: message.createdAt,
        user: {
          id: message.user.id,
          name: message.user.name,
        },
        status: "sent" as const,
      }));
      setMessages(formattedMessages.reverse());
    }
  }, [chatData]);

  // Handle new message via subscription
  useEffect(() => {
    if (subscriptionData?.subscriptionNewMessage) {
      const newMsg = subscriptionData.subscriptionNewMessage;

      // Don't add if it's from current user (already added optimistically)
      if (newMsg.user.id === currentUserId) {
        // Update status to sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.status === "sending" ? { ...msg, id: newMsg.id, status: "sent" as const } : msg
          )
        );
        return;
      }

      const formattedMsg: Message = {
        id: newMsg.id,
        text: newMsg.message,
        createdAt: newMsg.createdAt,
        user: {
          id: newMsg.user.id,
          name: newMsg.user.name,
        },
        status: "sent",
      };

      setMessages((prev) => [...prev, formattedMsg]);
      setUnreadCount((prev) => prev + 1);
      
      // Notifications
      playNotificationSound();
      showBrowserNotification(
        `Message de ${formattedMsg.user.name}`,
        formattedMsg.text
      );
      
      onNewMessage?.(formattedMsg);
    }
  }, [subscriptionData, currentUserId, playNotificationSound, showBrowserNotification, onNewMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSend = async () => {
    if (!inputMessage.trim() || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      text: inputMessage,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: currentUserName,
      },
      status: "sending",
    };

    // Add message optimistically
    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage("");
    inputRef.current?.focus();

    await sendChatMessage({
      variables: {
        orderId,
        messageInput: {
          message: inputMessage,
          user: {
            id: currentUserId,
            name: currentUserName,
          },
        },
      },
    });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Clear unread count when user focuses input
  const handleInputFocus = () => {
    setUnreadCount(0);
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-color to-primary-color/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">{t?.("chat_with_rider_button") || "Chat avec le livreur"}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/80">En ligne</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] bg-gray-50 dark:bg-gray-900/50">
        {chatLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary-color border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Démarrez une conversation avec votre livreur</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.user.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isCurrentUser
                      ? "bg-primary-color text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm shadow-sm"
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-medium text-primary-color dark:text-primary-light mb-1">
                      {msg.user.name}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isCurrentUser ? "text-white/70" : "text-gray-400"}`}>
                    <span className="text-xs">{formatTime(msg.createdAt)}</span>
                    {isCurrentUser && (
                      <span className="text-xs">
                        {msg.status === "sending" && (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {msg.status === "sent" && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {msg.status === "error" && (
                          <svg className="w-3 h-3 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            placeholder={t?.("type_a_message_placeholder") || "Tapez un message..."}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/30 dark:text-white placeholder-gray-400"
            disabled={sendingMessage}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || sendingMessage}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
              inputMessage.trim()
                ? "bg-primary-color text-white hover:bg-primary-color/90"
                : "bg-gray-200 dark:bg-gray-600 text-gray-400"
            }`}
          >
            {sendingMessage ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Floating chat button component
interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen?: boolean;
}

export function FloatingChatButton({ onClick, unreadCount = 0, isOpen = false }: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
        isOpen
          ? "bg-gray-600 hover:bg-gray-700"
          : "bg-primary-color hover:bg-primary-color/90"
      }`}
    >
      {isOpen ? (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// Chat container that manages open/close state
interface ChatContainerProps {
  orderId: string;
  currentUserId: string;
  currentUserName?: string;
  enabled?: boolean;
}

export function ChatContainer({ orderId, currentUserId, currentUserName, enabled = true }: ChatContainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  if (!enabled) return null;

  return (
    <>
      <FloatingChatButton
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setUnreadCount(0);
        }}
        unreadCount={unreadCount}
        isOpen={isOpen}
      />
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-48px)] z-50 animate-in slide-in-from-bottom-4 duration-200">
          <RealTimeChat
            orderId={orderId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onClose={() => setIsOpen(false)}
            onNewMessage={() => {
              if (!isOpen) setUnreadCount((prev) => prev + 1);
            }}
          />
        </div>
      )}
    </>
  );
}

export default RealTimeChat;
