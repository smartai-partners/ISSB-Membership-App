/**
 * FAQ Table Component
 * Displays FAQs with edit and delete actions
 */

import React, { useState } from 'react';
import { Edit, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteFAQ } from '@/hooks/useHelpAssistant';
import type { FAQ } from '@/types';

interface FAQTableProps {
  faqs: FAQ[];
  onEdit: (faq: FAQ) => void;
}

export function FAQTable({ faqs, onEdit }: FAQTableProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  const deleteMutation = useDeleteFAQ();

  const handleDeleteClick = (faq: FAQ) => {
    setFaqToDelete(faq);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;

    await deleteMutation.mutateAsync(faqToDelete.id);
    setShowDeleteDialog(false);
    setFaqToDelete(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setFaqToDelete(null);
  };

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No FAQs found. Create your first FAQ to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Question</TableHead>
              <TableHead className="w-1/3">Answer</TableHead>
              <TableHead className="w-1/6">Category</TableHead>
              <TableHead className="w-1/6">Last Updated</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow key={faq.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="max-w-xs truncate" title={faq.question}>
                    {faq.question}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-gray-600" title={faq.answer}>
                    {faq.answer}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 border" variant="secondary">
                    {faq.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(faq.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Actions for FAQ: ${faq.question}`}
                        className="hover:bg-gray-100 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onEdit(faq)}
                        className="cursor-pointer focus:bg-gray-100"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit FAQ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(faq)}
                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete FAQ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent
          className="sm:max-w-[500px]"
          onEscapeKeyDown={handleCloseDeleteDialog}
        >
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {faqToDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-2">Question:</p>
                <p className="text-gray-700">{faqToDelete.question}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={deleteMutation.isPending}
              className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete FAQ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
