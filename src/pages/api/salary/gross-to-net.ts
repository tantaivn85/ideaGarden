import type { APIRoute } from 'astro';

interface SalaryRequest {
  grossSalary: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { grossSalary } = data as SalaryRequest;

    if (!grossSalary || typeof grossSalary !== 'number' || grossSalary <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid gross salary. Must be a positive number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Vietnam Personal Income Tax Brackets 2026
    const taxBrackets = [
      { min: 0, max: 5000000, rate: 0.05 },
      { min: 5000000, max: 10000000, rate: 0.1 },
      { min: 10000000, max: 20000000, rate: 0.15 },
      { min: 20000000, max: Infinity, rate: 0.2 },
    ];

    // Calculate cumulative personal income tax
    let tax = 0;
    for (const bracket of taxBrackets) {
      if (grossSalary > bracket.min) {
        const taxableIncome = Math.min(grossSalary, bracket.max) - bracket.min;
        tax += taxableIncome * bracket.rate;
      }
    }

    const socialInsurance = grossSalary * 0.08;
    const healthInsurance = grossSalary * 0.015;
    const unemploymentInsurance = grossSalary * 0.005;

    const totalDeductions = tax + socialInsurance + healthInsurance + unemploymentInsurance;
    const netSalary = grossSalary - totalDeductions;

    return new Response(
      JSON.stringify({
        success: true,
        grossSalary,
        breakdown: {
          personalIncomeTax: Math.round(tax),
          socialInsurance: Math.round(socialInsurance),
          healthInsurance: Math.round(healthInsurance),
          unemploymentInsurance: Math.round(unemploymentInsurance),
        },
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary),
        country: 'Vietnam',
        taxYear: 2026,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof SyntaxError ? 'Invalid JSON in request body' : 'Request processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
