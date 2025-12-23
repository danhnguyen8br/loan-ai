import { NextResponse } from 'next/server';
import { PRODUCT_TEMPLATES } from '@loan-ai/loan-engine';
import type { ProductTemplate } from '@loan-ai/loan-engine';
import fs from 'fs';
import path from 'path';

const CUSTOM_TEMPLATES_PATH = path.join(process.cwd(), 'data', 'custom-templates.json');

function ensureDataDir() {
  const dataDir = path.dirname(CUSTOM_TEMPLATES_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadCustomTemplates(): ProductTemplate[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CUSTOM_TEMPLATES_PATH)) {
      const data = fs.readFileSync(CUSTOM_TEMPLATES_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom templates:', error);
  }
  return [];
}

function saveCustomTemplates(templates: ProductTemplate[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CUSTOM_TEMPLATES_PATH, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error saving custom templates:', error);
    throw error;
  }
}

// Get a single template by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const customTemplates = loadCustomTemplates();
    const allTemplates = [...PRODUCT_TEMPLATES, ...customTemplates];
    
    const template = allTemplates.find(t => t.id === id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      template: {
        ...template,
        is_custom: customTemplates.some(ct => ct.id === id),
        is_builtin: PRODUCT_TEMPLATES.some(bt => bt.id === id),
      },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// Update a template
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<ProductTemplate> = body;
    
    const customTemplates = loadCustomTemplates();
    const isBuiltIn = PRODUCT_TEMPLATES.some(t => t.id === id);
    const customIndex = customTemplates.findIndex(t => t.id === id);
    
    if (isBuiltIn && customIndex === -1) {
      // Create a custom override of a built-in template
      const builtInTemplate = PRODUCT_TEMPLATES.find(t => t.id === id);
      if (!builtInTemplate) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      
      const updatedTemplate: ProductTemplate = {
        ...builtInTemplate,
        ...updates,
        id, // Keep original ID
      };
      
      customTemplates.push(updatedTemplate);
      saveCustomTemplates(customTemplates);
      
      return NextResponse.json({
        template: { ...updatedTemplate, is_custom: true, is_builtin: true },
        message: 'Created custom override of built-in template',
      });
    }
    
    if (customIndex !== -1) {
      // Update existing custom template
      customTemplates[customIndex] = {
        ...customTemplates[customIndex],
        ...updates,
        id, // Keep original ID
      };
      saveCustomTemplates(customTemplates);
      
      return NextResponse.json({
        template: { ...customTemplates[customIndex], is_custom: true, is_builtin: isBuiltIn },
        message: 'Template updated successfully',
      });
    }
    
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// Delete a template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const customTemplates = loadCustomTemplates();
    const customIndex = customTemplates.findIndex(t => t.id === id);
    const isBuiltIn = PRODUCT_TEMPLATES.some(t => t.id === id);
    
    if (customIndex === -1) {
      if (isBuiltIn) {
        return NextResponse.json(
          { error: 'Cannot delete built-in templates. You can only delete custom templates or custom overrides.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Remove the custom template
    customTemplates.splice(customIndex, 1);
    saveCustomTemplates(customTemplates);
    
    return NextResponse.json({
      message: isBuiltIn 
        ? 'Custom override removed. Built-in template restored.' 
        : 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

