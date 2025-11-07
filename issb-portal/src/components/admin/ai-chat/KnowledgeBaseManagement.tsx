import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, ThumbsUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  searchKnowledgeBase,
  deleteKnowledgeBaseArticle,
  type KnowledgeBaseArticle,
} from '../../../lib/ai-chat-api';
import { KnowledgeBaseArticleModal } from './KnowledgeBaseArticleModal';
import { useToast } from '../../../hooks/use-toast';

export const KnowledgeBaseManagement: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, categoryFilter, articles]);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const data = await searchKnowledgeBase(undefined, undefined, 100);
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge base articles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setIsModalOpen(true);
  };

  const handleEditArticle = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await deleteKnowledgeBaseArticle(articleId);
      toast({
        title: 'Success',
        description: 'Article deleted successfully',
      });
      loadArticles();
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive',
      });
    }
  };

  const handleModalClose = (refresh: boolean) => {
    setIsModalOpen(false);
    setSelectedArticle(null);
    if (refresh) {
      loadArticles();
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, string> = {
      volunteering: 'bg-blue-500',
      events: 'bg-green-500',
      membership: 'bg-purple-500',
      badges: 'bg-yellow-500',
      portal_features: 'bg-indigo-500',
      troubleshooting: 'bg-red-500',
      admin_procedures: 'bg-gray-500',
    };
    return variants[category] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Knowledge Base Management</CardTitle>
            <Button onClick={handleCreateArticle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="volunteering">Volunteering</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="badges">Badges</SelectItem>
                  <SelectItem value="portal_features">Portal Features</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="admin_procedures">Admin Procedures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Articles Table */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading articles...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No articles found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{article.title}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeVariant(article.category)}>
                          {article.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{article.access_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.is_published ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Article Modal */}
      {isModalOpen && (
        <KnowledgeBaseArticleModal
          article={selectedArticle}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};
