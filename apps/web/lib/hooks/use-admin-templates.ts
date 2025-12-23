import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductTemplate } from '@/lib/simulator-types';

export interface TemplateWithMeta extends ProductTemplate {
  is_custom: boolean;
  is_builtin: boolean;
}

export interface TemplatesResponse {
  templates: TemplateWithMeta[];
  count: number;
  custom_count: number;
  builtin_count: number;
}

const TEMPLATES_KEY = ['admin', 'templates'];

// Fetch all templates
async function fetchTemplates(includeBuiltIn = true, category?: string): Promise<TemplatesResponse> {
  const params = new URLSearchParams();
  if (!includeBuiltIn) params.set('includeBuiltIn', 'false');
  if (category) params.set('category', category);
  
  const url = `/api/admin/templates${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error('Failed to fetch templates');
  }
  
  return res.json();
}

// Fetch single template
async function fetchTemplate(id: string): Promise<{ template: TemplateWithMeta }> {
  const res = await fetch(`/api/admin/templates/${id}`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch template');
  }
  
  return res.json();
}

// Create template
async function createTemplate(template: ProductTemplate): Promise<{ template: TemplateWithMeta; message: string }> {
  const res = await fetch('/api/admin/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create template');
  }
  
  return res.json();
}

// Update template
async function updateTemplate({ id, data }: { id: string; data: Partial<ProductTemplate> }): Promise<{ template: TemplateWithMeta; message: string }> {
  const res = await fetch(`/api/admin/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update template');
  }
  
  return res.json();
}

// Delete template
async function deleteTemplate(id: string): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/templates/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete template');
  }
  
  return res.json();
}

// Hooks
export function useAdminTemplates(includeBuiltIn = true, category?: string) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, { includeBuiltIn, category }],
    queryFn: () => fetchTemplates(includeBuiltIn, category),
  });
}

export function useAdminTemplate(id: string) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, id],
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

// Duplicate a template with a new ID
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: TemplateWithMeta) => {
      const newTemplate: ProductTemplate = {
        ...template,
        id: `${template.id}_copy_${Date.now()}`,
        name: `${template.name} (Copy)`,
      };
      // Remove meta fields
      delete (newTemplate as any).is_custom;
      delete (newTemplate as any).is_builtin;
      
      return createTemplate(newTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

