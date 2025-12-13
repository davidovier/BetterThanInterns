'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Sparkles, Zap, X } from 'lucide-react';
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
  // M17: Presence layer events
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  // M20: First-run detection
  isFirstRun?: boolean;
  // M21: Scroll target refs for Continue Work behavior
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
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
  onInputFocus,
  onInputBlur,
  isFirstRun = false,
  inputRef: externalInputRef,
  messagesEndRef: externalMessagesEndRef,
}: SessionChatPaneProps) {
  // M21: Use external refs if provided, otherwise create internal ones
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;
  const textareaRef = externalInputRef || internalTextareaRef;

  // M20: Dismissible starter example state
  const [showStarterExample, setShowStarterExample] = useState(true);

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
    <div className="flex flex-col h-full bg-white">
      {/* M19: Working Notes header */}
      <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Working Notes
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {/* M20: First-run starter example (dismissible) */}
        {isFirstRun && showStarterExample && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/50"
          >
            <button
              onClick={() => setShowStarterExample(false)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-200 rounded transition-colors"
              aria-label="Dismiss example"
            >
              <X className="h-3 w-3 text-slate-400" />
            </button>
            <div className="pr-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">
                Example
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Invoices arrive by email, then finance checks the vendor, then approval is required before payment.
              </p>
            </div>
          </motion.div>
        )}

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

        {/* M19: Document-style messages (less chat-like) */}
        {!isFirstTime && (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pb-4 border-b border-slate-100 last:border-0"
              >
                {message.role === 'user' ? (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                      You · {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                ) : message.role === 'system' ? (
                  <div className="text-xs text-slate-400 italic">{message.content}</div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Assistant · {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* M19: Simplified typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <Sparkles className="h-3 w-3" />
            <span>Assistant is working</span>
            <div className="flex gap-0.5">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="w-1 h-1 bg-slate-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                className="w-1 h-1 bg-slate-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                className="w-1 h-1 bg-slate-400 rounded-full"
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* M19: Input Area - More document-like */}
      <div className="border-t border-slate-200 bg-white">
        <div className="px-6 py-4">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Add context, clarify a process, or ask for analysis..."
            className="resize-none min-h-[60px] max-h-[160px] text-sm border-slate-200 focus:border-slate-300 bg-white"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-slate-400">
              Press Enter to send · Shift+Enter for new line
            </div>
            <Button
              onClick={onSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-slate-700 hover:bg-slate-800 text-white h-7 px-3 text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Add Note'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
