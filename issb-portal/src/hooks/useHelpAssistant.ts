/**
 * Help Assistant Hooks
 * TanStack Query hooks for FAQ and Escalated Conversations management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQCategories,
  getEscalatedConversations,
  updateConversationStatus,
  assignConversation,
  deleteConversation,
  type FAQFilters,
  type ConversationFilters,
} from '@/lib/help-assistant-api';
import type { FAQ, EscalatedConversation, ConversationStatus } from '@/types';
import { toastSuccess, toastError, toastLoading, dismissToast } from '@/lib/toast-service';
import { mapSupabaseError } from '@/lib/error-mapping';

// ===== FAQ Hooks =====

export function useFAQs(filters?: FAQFilters) {
  return useQuery({
    queryKey: ['faqs', filters],
    queryFn: () => getFAQs(filters),
  });
}

export function useFAQCategories() {
  return useQuery({
    queryKey: ['faq-categories'],
    queryFn: getFAQCategories,
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
      const toastId = toastLoading.saving();
      return createFAQ(faq).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      toastSuccess.userCreated('FAQ');
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.updateFailed(mappedError.message);
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FAQ> }) => {
      const toastId = toastLoading.saving();
      return updateFAQ(id, updates).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      toastSuccess.userUpdated('FAQ');
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.updateFailed(mappedError.message);
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const toastId = toastLoading.deleting();
      return deleteFAQ(id).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      toastSuccess.userDeleted();
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.deleteFailed(mappedError.message);
    },
  });
}

// ===== Escalated Conversations Hooks =====

export function useEscalatedConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: ['escalated-conversations', filters],
    queryFn: () => getEscalatedConversations(filters),
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ConversationStatus;
      notes?: string;
    }) => {
      const toastId = toastLoading.saving();
      return updateConversationStatus(id, status, notes).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-conversations'] });
      toastSuccess.statusUpdated('Conversation', 'updated');
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.updateFailed(mappedError.message);
    },
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => {
      const toastId = toastLoading.saving();
      return assignConversation(id, assignedTo).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-conversations'] });
      toastSuccess.userUpdated('Conversation assignment');
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.updateFailed(mappedError.message);
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const toastId = toastLoading.deleting();
      return deleteConversation(id).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-conversations'] });
      toastSuccess.userDeleted();
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.deleteFailed(mappedError.message);
    },
  });
}
