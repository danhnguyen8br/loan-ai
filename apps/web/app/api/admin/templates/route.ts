import { NextResponse } from 'next/server';
import { getAllTemplates, PRODUCT_TEMPLATES } from '@loan-ai/loan-engine';
import type { ProductTemplate } from '@loan-ai/loan-engine';
import fs from 'fs';
import path from 'path';

// Path to custom templates JSON file
const CUSTOM_TEMPLATES_PATH = path.join(process.cwd(), 'data', 'custom-templates.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(CUSTOM_TEMPLATES_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load custom templates from file
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

// Save custom templates to file
function saveCustomTemplates(templates: ProductTemplate[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CUSTOM_TEMPLATES_PATH, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error saving custom templates:', error);
    throw error;
  }
}

// Get all templates (built-in + custom)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBuiltIn = searchParams.get('includeBuiltIn') !== 'false';
    const category = searchParams.get('category');
    
    const customTemplates = loadCustomTemplates();
    let templates: ProductTemplate[] = [];
    
    if (includeBuiltIn) {
      // Combine built-in and custom templates, with custom overriding built-in by ID
      const customIds = new Set(customTemplates.map(t => t.id));
      const builtInFiltered = PRODUCT_TEMPLATES.filter(t => !customIds.has(t.id));
      templates = [...builtInFiltered, ...customTemplates];
    } else {
      templates = customTemplates;
    }
    
    // Filter by category if specified
    if (category === 'MORTGAGE_RE' || category === 'REFINANCE') {
      templates = templates.filter(t => t.category === category);
    }
    
    // Add metadata to distinguish custom from built-in
    const templatesWithMeta = templates.map(t => ({
      ...t,
      is_custom: customTemplates.some(ct => ct.id === t.id),
      is_builtin: PRODUCT_TEMPLATES.some(bt => bt.id === t.id),
    }));
    
    return NextResponse.json({
      templates: templatesWithMeta,
      count: templatesWithMeta.length,
      custom_count: customTemplates.length,
      builtin_count: PRODUCT_TEMPLATES.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Create a new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const template: ProductTemplate = body;
    
    // Validate required fields
    if (!template.id || !template.name || !template.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, category' },
        { status: 400 }
      );
    }
    
    // Check for duplicate ID
    const customTemplates = loadCustomTemplates();
    const allTemplates = [...PRODUCT_TEMPLATES, ...customTemplates];
    if (allTemplates.some(t => t.id === template.id)) {
      return NextResponse.json(
        { error: 'Template with this ID already exists' },
        { status: 409 }
      );
    }
    
    // Add the new template
    customTemplates.push(template);
    saveCustomTemplates(customTemplates);
    
    return NextResponse.json({
      template: { ...template, is_custom: true, is_builtin: false },
      message: 'Template created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

