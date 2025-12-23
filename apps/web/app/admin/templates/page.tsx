'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  useAdminTemplates, 
  useCreateTemplate, 
  useUpdateTemplate, 
  useDeleteTemplate,
  useDuplicateTemplate,
  TemplateWithMeta 
} from '@/lib/hooks/use-admin-templates';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import type { ProductTemplate, ProductCategory, PrepaymentScheduleItem } from '@/lib/simulator-types';

type SortField = 'name' | 'category' | 'promo_rate' | 'data_confidence_score';
type SortDirection = 'asc' | 'desc';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  MORTGAGE_RE: 'Vay Mua Nhà',
  REFINANCE: 'Tái Tài Trợ',
};

export default function AdminTemplatesPage() {
  const { data, isLoading, refetch } = useAdminTemplates();
  
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | ''>('');
  const [filterType, setFilterType] = useState<'all' | 'builtin' | 'custom'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithMeta | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithMeta | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'rates' | 'fees' | 'prepayment'>('basic');

  const templates = data?.templates || [];

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }
    
    // Type filter
    if (filterType === 'builtin') {
      result = result.filter(t => t.is_builtin && !t.is_custom);
    } else if (filterType === 'custom') {
      result = result.filter(t => t.is_custom);
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'promo_rate':
          aVal = a.rates.promo_fixed_rate_pct;
          bVal = b.rates.promo_fixed_rate_pct;
          break;
        case 'data_confidence_score':
          aVal = a.data_confidence_score;
          bVal = b.data_confidence_score;
          break;
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
    
    return result;
  }, [templates, searchQuery, filterCategory, filterType, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => ({
    total: templates.length,
    builtin: data?.builtin_count || 0,
    custom: data?.custom_count || 0,
    mortgageRe: templates.filter(t => t.category === 'MORTGAGE_RE').length,
    refinance: templates.filter(t => t.category === 'REFINANCE').length,
  }), [templates, data]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: TemplateWithMeta) => {
    setEditingTemplate(template);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (template: TemplateWithMeta) => {
    try {
      await duplicateMutation.mutateAsync(template);
      refetch();
    } catch (err) {
      alert('Failed to duplicate template');
    }
  };

  const handleDelete = (template: TemplateWithMeta) => {
    if (template.is_builtin && !template.is_custom) {
      alert('Cannot delete built-in templates. You can only delete custom templates.');
      return;
    }
    setDeletingTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      refetch();
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-leadity-gray">Đang tải templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-darker">
            Product <span className="text-primary">Templates</span>
          </h1>
          <p className="text-leadity-gray mt-1">
            Manage simulator product templates for mortgage calculations
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="md" className="gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <Card variant="elevated" className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <CardBody className="p-4">
            <p className="text-sm text-leadity-gray">Total Templates</p>
            <p className="text-2xl font-bold text-dark-darker">{stats.total}</p>
          </CardBody>
        </Card>
        <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
          <CardBody className="p-4">
            <p className="text-sm text-leadity-gray">Built-in</p>
            <p className="text-2xl font-bold text-dark-darker">{stats.builtin}</p>
          </CardBody>
        </Card>
        <Card variant="elevated" className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
          <CardBody className="p-4">
            <p className="text-sm text-leadity-gray">Custom</p>
            <p className="text-2xl font-bold text-dark-darker">{stats.custom}</p>
          </CardBody>
        </Card>
        <Card variant="elevated" className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50">
          <CardBody className="p-4">
            <p className="text-sm text-leadity-gray">Mortgage RE</p>
            <p className="text-2xl font-bold text-dark-darker">{stats.mortgageRe}</p>
          </CardBody>
        </Card>
        <Card variant="elevated" className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
          <CardBody className="p-4">
            <p className="text-sm text-leadity-gray">Refinance</p>
            <p className="text-2xl font-bold text-dark-darker">{stats.refinance}</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="mb-6">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <Select
              options={[
                { value: '', label: 'All Categories' },
                { value: 'MORTGAGE_RE', label: 'Vay Mua Nhà' },
                { value: 'REFINANCE', label: 'Tái Tài Trợ' },
              ]}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ProductCategory | '')}
            />
            <div className="flex gap-2">
              {(['all', 'builtin', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1
                    ${filterType === type
                      ? 'bg-primary text-dark-darker'
                      : 'bg-gray-100 text-leadity-gray hover:bg-gray-200'
                    }
                  `}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end text-sm text-leadity-gray">
              <span>
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Templates Table */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-semibold text-dark hover:text-primary transition-colors"
                  >
                    Template Name
                    {sortField === 'name' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center gap-2 text-sm font-semibold text-dark hover:text-primary transition-colors"
                  >
                    Category
                    {sortField === 'category' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-dark">
                  Type
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('promo_rate')}
                    className="flex items-center gap-2 text-sm font-semibold text-dark hover:text-primary transition-colors ml-auto"
                  >
                    Promo Rate
                    {sortField === 'promo_rate' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-dark">
                  Promo Period
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-dark">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-leadity-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-leadity-gray">No templates found</p>
                    <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4">
                      Create your first template
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-dark-darker">{template.name}</p>
                        <p className="text-xs text-leadity-gray font-mono">{template.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={template.category === 'MORTGAGE_RE' ? 'primary' : 'default'}>
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {template.is_custom ? (
                        <Badge variant="success">
                          {template.is_builtin ? 'Override' : 'Custom'}
                        </Badge>
                      ) : (
                        <Badge variant="default">Built-in</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-primary">
                        {template.rates.promo_fixed_rate_pct}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-dark">
                        {template.rates.promo_fixed_months} months
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(template)}
                          className="p-2 rounded-lg text-leadity-gray hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="p-2 rounded-lg text-leadity-gray hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {(template.is_custom || !template.is_builtin) && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 rounded-lg text-leadity-gray hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <TemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={async (data) => {
          try {
            if (editingTemplate) {
              await updateMutation.mutateAsync({ id: editingTemplate.id, data });
            } else {
              await createMutation.mutateAsync(data as ProductTemplate);
            }
            refetch();
            setIsModalOpen(false);
          } catch (err: any) {
            alert(err.message || 'Failed to save template');
          }
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Template"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-dark-darker font-medium">
                Delete this template?
              </p>
              <p className="text-leadity-gray text-sm mt-1">
                &ldquo;{deletingTemplate?.name}&rdquo; will be permanently removed.
                {deletingTemplate?.is_builtin && ' The original built-in version will be restored.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Template Form Modal Component
function TemplateFormModal({
  isOpen,
  onClose,
  template,
  activeTab,
  setActiveTab,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateWithMeta | null;
  activeTab: 'basic' | 'rates' | 'fees' | 'prepayment';
  setActiveTab: (tab: 'basic' | 'rates' | 'fees' | 'prepayment') => void;
  onSave: (data: Partial<ProductTemplate>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<ProductTemplate>>({});
  const [prepaymentSchedule, setPrepaymentSchedule] = useState<PrepaymentScheduleItem[]>([]);

  // Initialize form data when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setFormData({ ...template });
        setPrepaymentSchedule(template.prepayment_penalty?.schedule || []);
      } else {
        // Default values for new template
        setFormData({
          id: '',
          name: '',
          category: 'MORTGAGE_RE',
          description: '',
          loan_limits: {
            max_ltv_pct: 70,
            max_dti_pct: 50,
          },
          term_rules: {
            min_term_months: 60,
            max_term_months: 300,
          },
          repayment_defaults: {
            repayment_method_default: 'annuity',
            payment_recalc_rule: 'on_rate_reset',
          },
          grace: {
            grace_principal_months: 0,
          },
          rates: {
            promo_fixed_months: 12,
            promo_fixed_rate_pct: 7.5,
            floating_reference_assumption_pct: 6.0,
            floating_margin_pct: 2.5,
            reset_frequency_months: 3,
          },
          fees: {
            origination_fee_pct: 1.0,
            appraisal_fee_vnd: 3_000_000,
            insurance: {
              enabled_default: false,
              mandatory: false,
              annual_pct: 0.1,
              basis: 'on_balance',
            },
          },
          prepayment_penalty: {
            schedule: [],
            allow_partial_prepay: true,
            partial_prepay_min_vnd: 10_000_000,
          },
          assumptions: {
            reference_rate_note: '',
            fee_notes: '',
          },
          data_confidence_score: 100,
        });
        setPrepaymentSchedule([]);
      }
    }
  }, [isOpen, template]);

  const updateField = (path: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addPrepaymentTier = () => {
    const lastTier = prepaymentSchedule[prepaymentSchedule.length - 1];
    const newTier: PrepaymentScheduleItem = {
      from_month_inclusive: lastTier ? (lastTier.to_month_exclusive || 12) : 0,
      to_month_exclusive: lastTier ? (lastTier.to_month_exclusive || 12) + 12 : 12,
      fee_pct: 2,
    };
    setPrepaymentSchedule([...prepaymentSchedule, newTier]);
  };

  const removePrepaymentTier = (index: number) => {
    setPrepaymentSchedule(prepaymentSchedule.filter((_, i) => i !== index));
  };

  const updatePrepaymentTier = (index: number, field: keyof PrepaymentScheduleItem, value: any) => {
    const updated = [...prepaymentSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setPrepaymentSchedule(updated);
  };

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      prepayment_penalty: {
        schedule: prepaymentSchedule,
        allow_partial_prepay: formData.prepayment_penalty?.allow_partial_prepay ?? true,
        partial_prepay_min_vnd: formData.prepayment_penalty?.partial_prepay_min_vnd,
      },
    };
    onSave(finalData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'rates', label: 'Rates' },
    { id: 'fees', label: 'Fees' },
    { id: 'prepayment', label: 'Prepayment' },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create New Template'}
      size="xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-leadity-gray hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Template ID"
              value={formData.id || ''}
              onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., my_custom_template"
              required
              disabled={!!template}
            />
            <Select
              label="Category"
              options={[
                { value: 'MORTGAGE_RE', label: 'Vay Mua Nhà (Mortgage RE)' },
                { value: 'REFINANCE', label: 'Tái Tài Trợ (Refinance)' },
              ]}
              value={formData.category || 'MORTGAGE_RE'}
              onChange={(e) => updateField('category', e.target.value)}
            />
          </div>
          <Input
            label="Template Name"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Vay Mua Nhà Ưu Đãi 12 Tháng"
            required
          />
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe this template..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Max LTV (%)"
              value={formData.loan_limits?.max_ltv_pct || ''}
              onChange={(e) => updateField('loan_limits.max_ltv_pct', Number(e.target.value))}
            />
            <Input
              type="number"
              label="Max DTI (%)"
              value={formData.loan_limits?.max_dti_pct || ''}
              onChange={(e) => updateField('loan_limits.max_dti_pct', Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Min Term (months)"
              value={formData.term_rules?.min_term_months || ''}
              onChange={(e) => updateField('term_rules.min_term_months', Number(e.target.value))}
            />
            <Input
              type="number"
              label="Max Term (months)"
              value={formData.term_rules?.max_term_months || ''}
              onChange={(e) => updateField('term_rules.max_term_months', Number(e.target.value))}
            />
            <Input
              type="number"
              label="Grace Period (months)"
              value={formData.grace?.grace_principal_months || 0}
              onChange={(e) => updateField('grace.grace_principal_months', Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Default Repayment Method"
              options={[
                { value: 'annuity', label: 'Annuity (Equal Payments)' },
                { value: 'equal_principal', label: 'Equal Principal' },
              ]}
              value={formData.repayment_defaults?.repayment_method_default || 'annuity'}
              onChange={(e) => updateField('repayment_defaults.repayment_method_default', e.target.value)}
            />
            <Input
              type="number"
              label="Confidence Score (0-100)"
              value={formData.data_confidence_score || 100}
              onChange={(e) => updateField('data_confidence_score', Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </div>
      )}

      {/* Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-dark-darker mb-4">Promotional Rate</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Promo Fixed Rate (%)"
                value={formData.rates?.promo_fixed_rate_pct || ''}
                onChange={(e) => updateField('rates.promo_fixed_rate_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Promo Period (months)"
                value={formData.rates?.promo_fixed_months || ''}
                onChange={(e) => updateField('rates.promo_fixed_months', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-dark-darker mb-4">Floating Rate (Post-Promo)</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                label="Reference Rate Assumption (%)"
                value={formData.rates?.floating_reference_assumption_pct || ''}
                onChange={(e) => updateField('rates.floating_reference_assumption_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Floating Margin (%)"
                value={formData.rates?.floating_margin_pct || ''}
                onChange={(e) => updateField('rates.floating_margin_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Reset Frequency (months)"
                value={formData.rates?.reset_frequency_months || ''}
                onChange={(e) => updateField('rates.reset_frequency_months', Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-leadity-gray mt-2">
              Post-promo rate = Reference ({formData.rates?.floating_reference_assumption_pct || 0}%) + Margin ({formData.rates?.floating_margin_pct || 0}%) = {((formData.rates?.floating_reference_assumption_pct || 0) + (formData.rates?.floating_margin_pct || 0)).toFixed(2)}%
            </p>
          </div>

          <Textarea
            label="Rate Assumptions Note"
            value={formData.assumptions?.reference_rate_note || ''}
            onChange={(e) => updateField('assumptions.reference_rate_note', e.target.value)}
            placeholder="Notes about rate assumptions..."
            rows={2}
          />
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-dark-darker mb-4">Upfront Fees</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Origination Fee (%)"
                value={formData.fees?.origination_fee_pct || ''}
                onChange={(e) => updateField('fees.origination_fee_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Appraisal Fee (VND)"
                value={formData.fees?.appraisal_fee_vnd ? formData.fees.appraisal_fee_vnd / 1_000_000 : ''}
                onChange={(e) => updateField('fees.appraisal_fee_vnd', Number(e.target.value) * 1_000_000)}
                placeholder="Million VND"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                type="number"
                label="Refinance Processing Fee (%)"
                value={formData.fees?.refinance_processing_fee_pct || ''}
                onChange={(e) => updateField('fees.refinance_processing_fee_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Refinance Processing Fee (VND)"
                value={formData.fees?.refinance_processing_fee_vnd ? formData.fees.refinance_processing_fee_vnd / 1_000_000 : ''}
                onChange={(e) => updateField('fees.refinance_processing_fee_vnd', Number(e.target.value) * 1_000_000)}
                placeholder="Million VND"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-dark-darker mb-4">Insurance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.fees?.insurance?.enabled_default || false}
                    onChange={(e) => updateField('fees.insurance.enabled_default', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Enabled by Default</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.fees?.insurance?.mandatory || false}
                    onChange={(e) => updateField('fees.insurance.mandatory', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Mandatory</span>
                </label>
              </div>
              <Select
                label="Insurance Basis"
                options={[
                  { value: 'on_balance', label: 'On Loan Balance' },
                  { value: 'on_property_value', label: 'On Property Value' },
                ]}
                value={formData.fees?.insurance?.basis || 'on_balance'}
                onChange={(e) => updateField('fees.insurance.basis', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                type="number"
                label="Annual Insurance Rate (%)"
                value={formData.fees?.insurance?.annual_pct || ''}
                onChange={(e) => updateField('fees.insurance.annual_pct', Number(e.target.value))}
                step="0.01"
              />
              <Input
                type="number"
                label="Annual Insurance (VND)"
                value={formData.fees?.insurance?.annual_vnd ? formData.fees.insurance.annual_vnd / 1_000_000 : ''}
                onChange={(e) => updateField('fees.insurance.annual_vnd', Number(e.target.value) * 1_000_000)}
                placeholder="Million VND (alternative to %)"
              />
            </div>
          </div>

          <Textarea
            label="Fee Notes"
            value={formData.assumptions?.fee_notes || ''}
            onChange={(e) => updateField('assumptions.fee_notes', e.target.value)}
            placeholder="Notes about fees..."
            rows={2}
          />
        </div>
      )}

      {/* Prepayment Tab */}
      {activeTab === 'prepayment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-dark-darker">Prepayment Penalty Schedule</h3>
            <Button size="sm" variant="outline" onClick={addPrepaymentTier}>
              + Add Tier
            </Button>
          </div>

          {prepaymentSchedule.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-leadity-gray mb-4">No prepayment tiers defined</p>
              <Button size="sm" variant="outline" onClick={addPrepaymentTier}>
                Add First Tier
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {prepaymentSchedule.map((tier, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <Input
                      type="number"
                      label="From Month"
                      value={tier.from_month_inclusive}
                      onChange={(e) => updatePrepaymentTier(index, 'from_month_inclusive', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      label="To Month"
                      value={tier.to_month_exclusive ?? ''}
                      onChange={(e) => updatePrepaymentTier(index, 'to_month_exclusive', e.target.value ? Number(e.target.value) : null)}
                      placeholder="∞ (end)"
                    />
                    <Input
                      type="number"
                      label="Fee (%)"
                      value={tier.fee_pct}
                      onChange={(e) => updatePrepaymentTier(index, 'fee_pct', Number(e.target.value))}
                      step="0.1"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removePrepaymentTier(index)}
                    className="mt-6"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-dark mb-4">Partial Prepayment</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.prepayment_penalty?.allow_partial_prepay !== false}
                  onChange={(e) => updateField('prepayment_penalty.allow_partial_prepay', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Allow Partial Prepayment</span>
              </label>
              <Input
                type="number"
                label="Minimum Partial Amount (VND)"
                value={formData.prepayment_penalty?.partial_prepay_min_vnd ? formData.prepayment_penalty.partial_prepay_min_vnd / 1_000_000 : ''}
                onChange={(e) => updateField('prepayment_penalty.partial_prepay_min_vnd', Number(e.target.value) * 1_000_000)}
                placeholder="Million VND"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={isSaving}>
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </Modal>
  );
}

