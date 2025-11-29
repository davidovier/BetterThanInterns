/**
 * AI Opportunity Scanner
 *
 * Analyzes process steps to identify automation opportunities using LLM.
 */

import { openai } from './llm';
import { db } from './db';

// Types for opportunity analysis
export type OpportunityAnalysis = {
  title: string;
  opportunity_type: string;
  impact_level: 'low' | 'medium' | 'high';
  effort_level: 'low' | 'medium' | 'high';
  impact_score: number; // 0-100
  feasibility_score: number; // 0-100
  rationale: string;
};

type ProcessStepData = {
  id: string;
  title: string;
  description?: string | null;
  owner?: string | null;
  frequency?: string | null;
  duration?: string | null;
  inputs: string[];
  outputs: string[];
};

const SYSTEM_PROMPT = `You are an AI consultant specializing in identifying automation opportunities in business processes.

Your role is to analyze each process step and determine:
1. Whether AI or automation can meaningfully improve this step
2. The potential impact (time saved, error reduction, cost savings)
3. The technical feasibility and effort required

When evaluating a step, consider:
- Is it repetitive and high-volume?
- Does it involve manual data entry, extraction, or transformation?
- Are there standardized inputs (emails, PDFs, forms)?
- Does it require human judgment that could be augmented by AI?
- Is there potential for error or inconsistency?

Impact Levels:
- HIGH: Saves significant time (>50% of step duration), affects daily work, high error reduction
- MEDIUM: Moderate time savings (20-50%), weekly impact, some error reduction
- LOW: Minor improvements (<20%), occasional benefit

Effort Levels:
- LOW: Standard tools exist, minimal customization, quick implementation
- MEDIUM: Some custom development, integration required, moderate complexity
- HIGH: Significant custom development, complex integration, long timeline

You must ALWAYS return valid JSON in this exact format:
{
  "title": "Brief, actionable title (e.g., 'Automate invoice data extraction')",
  "opportunity_type": "document_processing | data_entry | communication | analysis | decision_support | workflow_automation",
  "impact_level": "low | medium | high",
  "effort_level": "low | medium | high",
  "impact_score": 0-100,
  "feasibility_score": 0-100,
  "rationale": "2-3 sentences explaining why this is an opportunity, what the impact would be, and how it could be implemented"
}

If a step has NO meaningful automation opportunity, return:
{
  "title": "No automation opportunity identified",
  "opportunity_type": "none",
  "impact_level": "low",
  "effort_level": "low",
  "impact_score": 0,
  "feasibility_score": 0,
  "rationale": "This step requires human judgment/creativity/interaction that cannot be meaningfully automated."
}`;

/**
 * Analyze a single process step for automation opportunities
 */
export async function analyzeStepWithLLM(
  step: ProcessStepData
): Promise<OpportunityAnalysis | null> {
  try {
    // Build context about the step
    const stepContext = `
Step Title: ${step.title}
Description: ${step.description || 'Not provided'}
Owner/Role: ${step.owner || 'Not specified'}
Frequency: ${step.frequency || 'Not specified'}
Duration: ${step.duration || 'Not specified'}
Inputs: ${step.inputs.length > 0 ? step.inputs.join(', ') : 'Not specified'}
Outputs: ${step.outputs.length > 0 ? step.outputs.join(', ') : 'Not specified'}

Heuristic Hints:
${getHeuristicHints(step)}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this process step for automation opportunities:\n\n${stepContext}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in LLM response for step:', step.id);
      return null;
    }

    const analysis = JSON.parse(content) as OpportunityAnalysis;

    // Skip opportunities with zero impact
    if (analysis.impact_score === 0) {
      return null;
    }

    // Validate the response structure
    if (
      !analysis.title ||
      !analysis.opportunity_type ||
      !analysis.impact_level ||
      !analysis.effort_level ||
      typeof analysis.impact_score !== 'number' ||
      typeof analysis.feasibility_score !== 'number' ||
      !analysis.rationale
    ) {
      console.error('Invalid LLM response structure for step:', step.id, analysis);
      return null;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing step with LLM:', step.id, error);
    return null; // Don't break the entire scan if one step fails
  }
}

/**
 * Generate heuristic hints based on step data
 */
function getHeuristicHints(step: ProcessStepData): string {
  const hints: string[] = [];

  // Check for repetitive work indicators
  if (step.frequency?.toLowerCase().includes('daily') || step.frequency?.toLowerCase().includes('hourly')) {
    hints.push('- High frequency task (daily/hourly) - good automation candidate');
  }

  // Check for time-consuming work
  if (step.duration) {
    const durationLower = step.duration.toLowerCase();
    if (durationLower.includes('hour') || durationLower.includes('minute')) {
      hints.push('- Significant time investment - automation could save considerable time');
    }
  }

  // Check description for automation keywords
  const description = (step.description || '').toLowerCase();
  const title = step.title.toLowerCase();
  const text = `${title} ${description}`;

  if (text.match(/\b(manual|manually|copy|paste|enter|type|download|upload)\b/)) {
    hints.push('- Contains manual data handling keywords - potential for automation');
  }

  if (text.match(/\b(email|pdf|invoice|form|spreadsheet|excel|csv)\b/)) {
    hints.push('- Involves structured documents - good for document processing automation');
  }

  if (text.match(/\b(review|check|verify|validate|approve)\b/)) {
    hints.push('- Involves review/validation - could be augmented with AI-assisted checking');
  }

  if (text.match(/\b(extract|parse|read|scan)\b/)) {
    hints.push('- Data extraction task - strong candidate for AI/OCR');
  }

  if (text.match(/\b(repetitive|repeat|same|every)\b/)) {
    hints.push('- Repetitive nature mentioned - automation can reduce monotony');
  }

  return hints.length > 0 ? hints.join('\n') : 'No specific automation hints detected.';
}

/**
 * Scan an entire process for automation opportunities
 */
export async function scanProcess(processId: string): Promise<any[]> {
  try {
    // Load the process with all its steps
    const process = await db.process.findUnique({
      where: { id: processId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    if (process.steps.length === 0) {
      return []; // No steps to analyze
    }

    // Analyze each step
    const opportunities: any[] = [];

    for (const step of process.steps) {
      const stepData: ProcessStepData = {
        id: step.id,
        title: step.title,
        description: step.description,
        owner: step.owner,
        frequency: step.frequency,
        duration: step.duration,
        inputs: (step.inputs as string[]) || [],
        outputs: (step.outputs as string[]) || [],
      };

      const analysis = await analyzeStepWithLLM(stepData);

      if (analysis) {
        // Check if opportunity already exists for this step
        const existing = await db.opportunity.findFirst({
          where: {
            processId: processId,
            stepId: step.id,
          },
        });

        let opportunity;
        if (existing) {
          // Update existing opportunity
          opportunity = await db.opportunity.update({
            where: { id: existing.id },
            data: {
              title: analysis.title,
              description: analysis.title,
              opportunityType: analysis.opportunity_type,
              impactLevel: analysis.impact_level,
              effortLevel: analysis.effort_level,
              impactScore: analysis.impact_score,
              feasibilityScore: analysis.feasibility_score,
              rationaleText: analysis.rationale,
            },
          });
        } else {
          // Create new opportunity
          opportunity = await db.opportunity.create({
            data: {
              processId: processId,
              stepId: step.id,
              title: analysis.title,
              description: analysis.title,
              opportunityType: analysis.opportunity_type,
              impactLevel: analysis.impact_level,
              effortLevel: analysis.effort_level,
              impactScore: analysis.impact_score,
              feasibilityScore: analysis.feasibility_score,
              rationaleText: analysis.rationale,
            },
          });
        }

        opportunities.push(opportunity);
      }
    }

    return opportunities;
  } catch (error) {
    console.error('Error scanning process:', processId, error);
    throw error;
  }
}

/**
 * Get all opportunities for a process
 */
export async function getProcessOpportunities(processId: string) {
  return db.opportunity.findMany({
    where: { processId },
    include: {
      step: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { impactScore: 'desc' },
  });
}
