/**
 * Admin Help Assistant Navigation
 * Tab navigation between FAQ Management and Escalated Conversations
 */

import React from 'react';
import { MessageSquare, HelpCircle } from 'lucide-react';

interface AdminHelpAssistantNavProps {
  activeTab: 'faqs' | 'conversations';
  onTabChange: (tab: 'faqs' | 'conversations') => void;
}

export function AdminHelpAssistantNav({ activeTab, onTabChange }: AdminHelpAssistantNavProps) {
  return (
    <nav className="border-b border-gray-200" role="tablist" aria-label="Help Assistant sections">
      <div className="flex space-x-8">
        <button
          role="tab"
          aria-selected={activeTab === 'faqs'}
          aria-controls="faq-panel"
          id="faq-tab"
          onClick={() => onTabChange('faqs')}
          className={`
            flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm
            ${
              activeTab === 'faqs'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
          FAQ Management
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'conversations'}
          aria-controls="conversations-panel"
          id="conversations-tab"
          onClick={() => onTabChange('conversations')}
          className={`
            flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm
            ${
              activeTab === 'conversations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Escalated Conversations
        </button>
      </div>
    </nav>
  );
}
