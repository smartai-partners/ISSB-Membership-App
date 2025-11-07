import React, { useState } from 'react';
import { MessageSquare, BookOpen, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { KnowledgeBaseManagement } from './KnowledgeBaseManagement';
import { EscalationManagement } from './EscalationManagement';

export const AIAssistantAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('knowledge-base');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Help Assistant Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage knowledge base articles and handle escalated support requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="escalations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Escalations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="mt-6">
          <KnowledgeBaseManagement />
        </TabsContent>

        <TabsContent value="escalations" className="mt-6">
          <EscalationManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
