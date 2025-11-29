import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  escalateConversation,
  type ChatMessage,
  type ChatSession
} from '../../lib/ai-chat-api';
import { useAuth } from '../../contexts/AuthContext';

export const FloatingChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const contextData = {
        current_page: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      const session = await createChatSession('Help Chat', contextData);
      setCurrentSession(session);
      
      // Load existing messages if any
      const history = await getChatHistory(session.id);
      setMessages(history.messages);
      
      // Send welcome message
      if (history.messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          session_id: session.id,
          sender_type: 'assistant',
          content: 'Hello! I am your AI assistant for the ISSB Portal. How can I help you today?',
          metadata: {},
          created_at: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        setSuggestions([
          'How do I apply for volunteer opportunities?',
          'Tell me about upcoming events',
          'How does the badge system work?'
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session when widget is opened
  useEffect(() => {
    if (isOpen && !currentSession && user) {
      initializeSession();
    }
  }, [isOpen, currentSession, user, initializeSession]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: currentSession.id,
      sender_type: 'user',
      content: inputMessage,
      metadata: {},
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await sendChatMessage(currentSession.id, inputMessage);
      setMessages(prev => [...prev, response.message]);
      setSuggestions(response.suggestions);
      setShowEscalation(response.escalation_suggested);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        session_id: currentSession.id,
        sender_type: 'assistant',
        content: 'I apologize, but I am having trouble responding right now. Please try again or escalate to a human agent.',
        metadata: { error: true },
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowEscalation(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const handleEscalate = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      await escalateConversation(
        currentSession.id,
        'User requested human assistance',
        'medium'
      );
      
      const escalationMessage: ChatMessage = {
        id: `escalation-${Date.now()}`,
        session_id: currentSession.id,
        sender_type: 'assistant',
        content: 'Your conversation has been escalated to a human agent. An admin will review your request and respond soon. You can continue using the portal, and we will notify you when an admin responds.',
        metadata: { type: 'system' },
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, escalationMessage]);
      setShowEscalation(false);
    } catch (error) {
      console.error('Failed to escalate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setCurrentSession(null);
    setMessages([]);
    setSuggestions([]);
    setShowEscalation(false);
    await initializeSession();
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          aria-label="Open help chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-6 right-6 w-96 shadow-2xl z-50 flex flex-col ${
          isMinimized ? 'h-14' : 'h-[600px]'
        } transition-all duration-200`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">AI Help Assistant</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
                title="New conversation"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.metadata.type === 'system' && (
                          <Badge variant="secondary" className="mt-2">System</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalation Banner */}
              {showEscalation && (
                <div className="px-4 py-2 border-t bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Need human assistance?
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEscalate}
                      className="text-xs"
                    >
                      Escalate to Admin
                    </Button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};
