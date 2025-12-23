import { NextResponse } from 'next/server';
import { 
  generateSchedule, 
  simulateMortgageAllStrategies,
  simulateRefinanceAllStrategies,
  getTemplateById,
  SimulateRequestSchema,
  MortgagePurchaseInputSchema,
  RefinanceInputSchema,
  type SimulateRequest,
  type SimulationResult,
  type MortgagePurchaseInput,
  type RefinanceInput,
  type MortgageMultiStrategyResult,
  type RefinanceMultiStrategyResult,
} from '@loan-ai/loan-engine';
import { z } from 'zod';

// V3 Request Schema - simplified, no strategies array needed
const SimulateRequestV3Schema = z.object({
  template_ids: z.array(z.string()).min(1),
  input: z.union([
    MortgagePurchaseInputSchema,
    RefinanceInputSchema,
  ]),
});

// Legacy endpoint for backward compatibility
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if this is a V3 request (has 'input' with 'type' field, no strategies array)
    if (body.input && body.input.type && !body.strategies) {
      return handleV3Request(body);
    }
    
    // Check if this is a V2 request (has 'input' with 'type' field AND strategies array)
    if (body.input && body.input.type && body.strategies) {
      return handleV3Request(body); // Use V3 handler, ignore strategies
    }
    
    // Legacy V1 request
    const parseResult = SimulateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { template_ids, user_input, strategies } = parseResult.data as SimulateRequest;
    
    const results: {
      template_id: string;
      strategy_type: string;
      result: SimulationResult;
    }[] = [];
    
    for (const templateId of template_ids) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      
      for (const strategy of strategies) {
        const result = generateSchedule(template, user_input, strategy);
        results.push({
          template_id: templateId,
          strategy_type: strategy.type,
          result,
        });
      }
    }
    
    // Sort by total cost (lowest first)
    results.sort((a, b) => 
      a.result.totals.total_cost_excl_principal - b.result.totals.total_cost_excl_principal
    );
    
    return NextResponse.json({
      results,
      count: results.length,
      user_input,
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}

// V3 handler - runs all 3 strategies automatically for each template
async function handleV3Request(body: unknown) {
  const parseResult = SimulateRequestV3Schema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request', 
        details: parseResult.error.errors 
      },
      { status: 400 }
    );
  }
  
  const { template_ids, input } = parseResult.data;
  
  if (input.type === 'MORTGAGE_RE') {
    const results: MortgageMultiStrategyResult[] = [];
    
    for (const templateId of template_ids) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      
      // Skip non-matching templates
      if (template.category !== 'MORTGAGE_RE') {
        continue;
      }
      
      const result = simulateMortgageAllStrategies(
        template,
        input as MortgagePurchaseInput
      );
      results.push(result);
    }
    
    // Sort templates by lowest M1 (min payment) total cost
    results.sort((a, b) => {
      const aM1 = a.strategies.find(s => s.strategy_id === 'M1_MIN_PAYMENT');
      const bM1 = b.strategies.find(s => s.strategy_id === 'M1_MIN_PAYMENT');
      if (!aM1 || !bM1) return 0;
      return aM1.result.totals.total_cost_excl_principal - bM1.result.totals.total_cost_excl_principal;
    });
    
    return NextResponse.json({
      type: 'MORTGAGE_RE',
      results,
      count: results.length,
    });
  } else {
    const results: RefinanceMultiStrategyResult[] = [];
    
    for (const templateId of template_ids) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      
      // Skip non-matching templates
      if (template.category !== 'REFINANCE') {
        continue;
      }
      
      const result = simulateRefinanceAllStrategies(
        template,
        input as RefinanceInput
      );
      results.push(result);
    }
    
    // Sort templates by highest R1 (refi now) net savings
    results.sort((a, b) => {
      const aR1 = a.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY');
      const bR1 = b.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY');
      if (!aR1 || !bR1) return 0;
      return bR1.result.net_saving_vnd - aR1.result.net_saving_vnd;
    });
    
    return NextResponse.json({
      type: 'REFINANCE',
      results,
      count: results.length,
    });
  }
}
