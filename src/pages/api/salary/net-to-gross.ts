import type { APIRoute } from 'astro';

interface NetToGrossRequest {
  netSalary: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { netSalary } = data as NetToGrossRequest;

    if (!netSalary || typeof netSalary !== 'number' || netSalary <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid net salary. Must be a positive number.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Vietnam tax brackets 2026
    const taxBrackets = [
      { min: 0, max: 5000000, rate: 0.05 },
      { min: 5000000, max: 10000000, rate: 0.1 },
      { min: 10000000, max: 20000000, rate: 0.15 },
      { min: 20000000, max: Infinity, rate: 0.2 },
    ];

    // Iterative calculation to find gross salary
    let gross = netSalary * 1.2;
    let netResult = 0;

    for (let iteration = 0; iteration < 20; iteration++) {
      let tax = 0;
      for (const bracket of taxBrackets) {
        if (gross > bracket.min) {
          const taxableIncome = Math.min(gross, bracket.max) - bracket.min;
          tax += taxableIncome * bracket.rate;
        }
      }

      const totalDeductions = tax + gross * 0.08 + gross * 0.015 + gross * 0.005;
      netResult = gross - totalDeductions;

      if (Math.abs(netResult - netSalary) < 500) break;

      const difference = netSalary - netResult;
      gross += difference / 0.895;
    }

    return new Response(
      JSON.stringify({
        success: true,
        netSalary,
        estimatedGross: Math.round(gross),
        country: 'Vietnam',
        taxYear: 2026,
        note: 'This is an estimate. Actual gross may vary slightly due to rounding and specific tax deductions.',
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
