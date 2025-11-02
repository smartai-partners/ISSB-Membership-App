/**
 * FAQ Form Modal
 * Create and edit FAQs with validation
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateFAQ, useUpdateFAQ } from '@/hooks/useHelpAssistant';
import type { FAQ } from '@/types';

interface FAQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  faq?: FAQ;
}

interface FormData {
  question: string;
  answer: string;
  category: string;
}

interface FormErrors {
  question?: string;
  answer?: string;
  category?: string;
}

export function FAQFormModal({ isOpen, onClose, onSuccess, faq }: FAQFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    question: '',
    answer: '',
    category: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const createMutation = useCreateFAQ();
  const updateMutation = useUpdateFAQ();

  const isEditing = !!faq;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Initialize form data when editing
  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: '',
      });
    }
    setFormErrors({});
    setTouchedFields(new Set());
  }, [faq, isOpen]);

  // Validation
  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'question':
        if (!value.trim()) return 'Question is required';
        if (value.length < 5) return 'Question must be at least 5 characters';
        return undefined;
      case 'answer':
        if (!value.trim()) return 'Answer is required';
        if (value.length < 10) return 'Answer must be at least 10 characters';
        return undefined;
      case 'category':
        if (!value.trim()) return 'Category is required';
        if (value.length < 2) return 'Category must be at least 2 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    const error = validateField(field, formData[field]);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setFormErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      question: validateField('question', formData.question),
      answer: validateField('answer', formData.answer),
      category: validateField('category', formData.category),
    };

    const cleanedErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== undefined)
    ) as FormErrors;

    setFormErrors(cleanedErrors);
    return Object.keys(cleanedErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: faq.id,
          updates: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the FAQ information below.'
              : 'Create a new frequently asked question for the knowledge base.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form error summary */}
          {Object.keys(formErrors).length > 0 && (
            <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Please fix the following errors:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          <div>
            <Label htmlFor="question">
              Question <span className="text-red-600" aria-label="required">*</span>
            </Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => handleFieldChange('question', e.target.value)}
              onBlur={() => handleFieldBlur('question')}
              aria-invalid={!!formErrors.question}
              aria-describedby={formErrors.question ? 'question-error' : undefined}
              className={formErrors.question ? 'border-red-500 focus:ring-red-500' : ''}
              placeholder="e.g., How do I become a member?"
            />
            {formErrors.question && (
              <p id="question-error" className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.question}
              </p>
            )}
            {!formErrors.question && touchedFields.has('question') && formData.question && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </p>
            )}
          </div>

          {/* Answer */}
          <div>
            <Label htmlFor="answer">
              Answer <span className="text-red-600" aria-label="required">*</span>
            </Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => handleFieldChange('answer', e.target.value)}
              onBlur={() => handleFieldBlur('answer')}
              aria-invalid={!!formErrors.answer}
              aria-describedby={formErrors.answer ? 'answer-error' : undefined}
              className={formErrors.answer ? 'border-red-500 focus:ring-red-500' : ''}
              placeholder="Provide a detailed answer..."
              rows={4}
            />
            {formErrors.answer && (
              <p id="answer-error" className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.answer}
              </p>
            )}
            {!formErrors.answer && touchedFields.has('answer') && formData.answer && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">
              Category <span className="text-red-600" aria-label="required">*</span>
            </Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              onBlur={() => handleFieldBlur('category')}
              aria-invalid={!!formErrors.category}
              aria-describedby={formErrors.category ? 'category-error' : undefined}
              className={formErrors.category ? 'border-red-500 focus:ring-red-500' : ''}
              placeholder="e.g., Membership, Events, Volunteering"
            />
            {formErrors.category && (
              <p id="category-error" className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.category}
              </p>
            )}
            {!formErrors.category && touchedFields.has('category') && formData.category && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || Object.keys(formErrors).length > 0}
            className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update FAQ' : 'Create FAQ'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
