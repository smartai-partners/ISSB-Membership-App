import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Switch } from '../../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  type KnowledgeBaseArticle,
} from '../../../lib/ai-chat-api';
import { useToast } from '../../../hooks/use-toast';

interface KnowledgeBaseArticleModalProps {
  article: KnowledgeBaseArticle | null;
  onClose: (refresh: boolean) => void;
}

export const KnowledgeBaseArticleModal: React.FC<KnowledgeBaseArticleModalProps> = ({
  article,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'volunteering',
    tags: '',
    access_level: 'all',
    is_published: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags.join(', '),
        access_level: article.access_level,
        is_published: article.is_published,
      });
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        access_level: formData.access_level,
        is_published: formData.is_published,
      };

      if (article) {
        await updateKnowledgeBaseArticle(article.id, articleData);
        toast({
          title: 'Success',
          description: 'Article updated successfully',
        });
      } else {
        await createKnowledgeBaseArticle(articleData);
        toast({
          title: 'Success',
          description: 'Article created successfully',
        });
      }

      onClose(true);
    } catch (error) {
      console.error('Failed to save article:', error);
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Edit Knowledge Base Article' : 'Create Knowledge Base Article'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter article title..."
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter article content..."
              rows={12}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can use basic markdown formatting. The AI will use this content to provide accurate responses.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Enter tags separated by commas..."
            />
            <p className="text-xs text-muted-foreground">
              Tags help the AI find relevant articles. Example: volunteer, application, getting started
            </p>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="access_level">Access Level</Label>
            <Select
              value={formData.access_level}
              onValueChange={(value) => setFormData({ ...formData, access_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="board">Board Members Only</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Published Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_published">Publish Article</Label>
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_published: checked })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
