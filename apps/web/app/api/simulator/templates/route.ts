import { NextResponse } from 'next/server';
import { getAllTemplates, getTemplatesByCategory } from '@loan-ai/loan-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let templates;
    if (category === 'MORTGAGE_RE' || category === 'REFINANCE') {
      templates = getTemplatesByCategory(category);
    } else {
      templates = getAllTemplates();
    }
    
    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

