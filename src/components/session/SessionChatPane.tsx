'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
};

type SessionChatPaneProps = {
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  // M16: Onboarding state
  hasProcesses?: boolean;
};

const STARTER_PROMPTS = [
  "Help me map my invoice approval process",
  "Map how we onboard new employees",
  "Map how we handle support tickets"
];

const EARLY_SESSION_HINTS = [
  "We do X → Y → Z when a client signs up…",
  "We approve invoices like this…",
  "First we receive the request, then we…"
];

export function SessionChatPane({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  hasProcesses = false,
}: SessionChatPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // M16: Determine if this is a brand new session
  const isFirstTime = messages.length === 0 && !hasProcesses;

  // M16: Show helper hints for early sessions (1-2 messages, no processes yet)
  const showEarlyHelper = messages.length > 0 && messages.length <= 2 && !hasProcesses;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleStarterClick = (prompt: string) => {
    // Pre-fill and immediately send
    onInputChange(prompt);
    // Use setTimeout to ensure the input is updated before sending
    setTimeout(() => {
      onSendMessage();
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* M16: First-Time Welcome State */}
        {isFirstTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center h-full space-y-6 px-4"
          >
            {/* Welcome Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            {/* Welcome Message */}
            <div className="text-center space-y-2 max-w-md">
              <h2 className="text-xl font-semibold text-slate-900">
                Let's map your process
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Describe a process in your own words, and we'll turn it into a visual workflow
                and scan for AI opportunities. No need for perfect wording—just start with
                "First we... then we..."
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="space-y-3 w-full max-w-md">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Try one of these:
              </p>
              <div className="space-y-2">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleStarterClick(prompt)}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-brand-500 flex-shrink-0 group-hover:text-brand-600" />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {prompt}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Messages */}
        {!isFirstTime && (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : message.role === 'system'
                      ? 'bg-muted/50 text-muted-foreground text-sm italic'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>AI Assistant</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background">
        {/* M16: Early Session Helper */}
        {showEarlyHelper && !isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 pb-2"
          >
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-brand-400" />
              <div>
                <span className="font-medium">Try describing steps like:</span>
                <div className="mt-1 space-y-0.5">
                  {EARLY_SESSION_HINTS.slice(0, 2).map((hint, idx) => (
                    <div key={idx} className="text-slate-400">• {hint}</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="p-4">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isFirstTime
                  ? "Describe your process... (e.g., 'First we receive an invoice, then...')"
                  : "Describe your process, ask questions, or request analysis..."
              }
              className="resize-none min-h-[80px] max-h-[200px]"
              disabled={isLoading}
            />
            <Button
              onClick={onSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="lg"
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
