/**
 * Tool Matching Engine
 *
 * Matches AI/automation tools to opportunities based on:
 * - Opportunity type
 * - Impact level
 * - Keywords in description
 * - Tool categories and use cases
 */

import { openai } from './llm';
import { db } from './db';

// Category mapping: opportunity type → tool categories
const CATEGORY_MAPPING: Record<string, string[]> = {
  document_processing: ['ocr', 'llm_agent', 'data_extraction'],
  data_entry: ['rpa', 'workflow_automation', 'data_extraction'],
  communication: ['llm_agent', 'workflow_automation', 'integration'],
  analysis: ['llm_agent', 'data_extraction'],
  decision_support: ['llm_agent', 'workflow_automation'],
  workflow_automation: ['workflow_automation', 'rpa', 'integration'],
};

// Keywords that suggest specific tool categories
const KEYWORD_PATTERNS = {
  invoice: ['ocr', 'data_extraction'],
  email: ['llm_agent', 'integration'],
  pdf: ['ocr', 'data_extraction'],
  spreadsheet: ['rpa', 'data_extraction'],
  ticket: ['llm_agent', 'workflow_automation'],
  customer: ['llm_agent', 'integration'],
  api: ['integration', 'workflow_automation'],
  database: ['rpa', 'integration'],
};

export type ToolRecommendation = {
  toolId: string;
  name: string;
  vendor: string | null;
  category: string;
  description: string;
  pricingTier: string;
  integrationComplexity: string;
  websiteUrl: string | null;
  matchScore: number;
  rationale: string;
  userSelected: boolean;
};

/**
 * Match tools for an opportunity and store recommendations
 */
export async function matchToolsForOpportunity(
  opportunityId: string
): Promise<ToolRecommendation[]> {
  try {
    // Load the opportunity with related data
    const opportunity = await db.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        step: true,
      },
    });

    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    // Get all available tools
    const allTools = await db.tool.findMany();

    if (allTools.length === 0) {
      console.warn('No tools in database. Please seed tools first.');
      return [];
    }

    // Filter and score candidate tools
    const candidateTools = filterAndScoreTools(opportunity, allTools);

    // Generate LLM-powered rationale for top tools
    const recommendations: ToolRecommendation[] = [];

    for (const candidate of candidateTools.slice(0, 5)) {
      // Top 5 tools
      const rationale = await generateToolRationale(opportunity, candidate.tool);

      // Upsert OpportunityTool record
      const oppTool = await db.opportunityTool.upsert({
        where: {
          opportunityId_toolId: {
            opportunityId: opportunityId,
            toolId: candidate.tool.id,
          },
        },
        create: {
          opportunityId: opportunityId,
          toolId: candidate.tool.id,
          matchScore: candidate.score,
          rationale: rationale,
          userSelected: false,
        },
        update: {
          matchScore: candidate.score,
          rationale: rationale,
        },
      });

      recommendations.push({
        toolId: candidate.tool.id,
        name: candidate.tool.name,
        vendor: candidate.tool.vendor,
        category: candidate.tool.category,
        description: candidate.tool.description,
        pricingTier: candidate.tool.pricingTier,
        integrationComplexity: candidate.tool.integrationComplexity,
        websiteUrl: candidate.tool.websiteUrl,
        matchScore: candidate.score,
        rationale: rationale,
        userSelected: oppTool.userSelected,
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error matching tools:', error);
    throw error;
  }
}

/**
 * Filter and score tools based on opportunity characteristics
 */
function filterAndScoreTools(
  opportunity: any,
  allTools: any[]
): { tool: any; score: number }[] {
  const scored = allTools.map((tool) => {
    let score = 0;

    // Base score from category matching
    const relevantCategories =
      CATEGORY_MAPPING[opportunity.opportunityType] || [];
    if (relevantCategories.includes(tool.category)) {
      score += 0.4;
    }

    // Keyword matching in title/description
    const text =
      `${opportunity.title} ${opportunity.description}`.toLowerCase();
    for (const [keyword, categories] of Object.entries(KEYWORD_PATTERNS)) {
      if (text.includes(keyword) && categories.includes(tool.category)) {
        score += 0.2;
      }
    }

    // Use case matching
    const toolUseCases = (tool.useCases as string[]) || [];
    const oppType = opportunity.opportunityType;
    if (toolUseCases.some((uc: string) => uc === oppType || text.includes(uc))) {
      score += 0.2;
    }

    // Integration complexity penalty for low-effort opportunities
    if (opportunity.effortLevel === 'low' && tool.integrationComplexity === 'high') {
      score -= 0.15;
    }

    // Pricing tier considerations
    // High-impact opportunities can justify enterprise tools
    if (opportunity.impactLevel === 'high' && tool.pricingTier === 'enterprise') {
      score += 0.1;
    } else if (
      opportunity.impactLevel === 'low' &&
      tool.pricingTier === 'enterprise'
    ) {
      score -= 0.1;
    }

    // Boost free/freemium tools slightly for low impact
    if (opportunity.impactLevel === 'low' && tool.pricingTier === 'free') {
      score += 0.1;
    }

    // Normalize score to 0-1 range
    score = Math.max(0, Math.min(1, score));

    return { tool, score };
  });

  // Filter out very low scores and sort by score descending
  return scored.filter((s) => s.score > 0.1).sort((a, b) => b.score - a.score);
}

/**
 * Generate LLM-powered rationale for why a tool matches an opportunity
 */
async function generateToolRationale(
  opportunity: any,
  tool: any
): Promise<string> {
  try {
    const prompt = `You are an AI consultant recommending automation tools.

Opportunity:
- Title: ${opportunity.title}
- Type: ${opportunity.opportunityType}
- Impact Level: ${opportunity.impactLevel}
- Description: ${opportunity.rationaleText}

Tool:
- Name: ${tool.name}
- Category: ${tool.category}
- Description: ${tool.description}
- Pricing: ${tool.pricingTier}
- Integration Complexity: ${tool.integrationComplexity}

Write a 2-3 sentence rationale explaining why this tool is a good fit for this opportunity.
Focus on:
1. How the tool's capabilities address the specific need
2. Key benefits (time savings, accuracy, ease of use)
3. Any relevant considerations (pricing, complexity)

Return ONLY the rationale text, no JSON or extra formatting.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI consultant. Provide clear, concise tool recommendations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const rationale = response.choices[0]?.message?.content?.trim();
    return (
      rationale ||
      `${tool.name} is well-suited for ${opportunity.opportunityType} tasks with ${tool.integrationComplexity} integration complexity.`
    );
  } catch (error) {
    console.error('Error generating rationale:', error);
    // Fallback rationale
    return `${tool.name} is a ${tool.category} tool that can help automate this ${opportunity.opportunityType} opportunity.`;
  }
}

/**
 * Get existing tool recommendations for an opportunity
 */
export async function getToolRecommendations(
  opportunityId: string
): Promise<ToolRecommendation[]> {
  const oppTools = await db.opportunityTool.findMany({
    where: { opportunityId },
    include: {
      tool: true,
    },
    orderBy: { matchScore: 'desc' },
  });

  return oppTools.map((ot) => ({
    toolId: ot.tool.id,
    name: ot.tool.name,
    vendor: ot.tool.vendor,
    category: ot.tool.category,
    description: ot.tool.description,
    pricingTier: ot.tool.pricingTier,
    integrationComplexity: ot.tool.integrationComplexity,
    websiteUrl: ot.tool.websiteUrl,
    matchScore: ot.matchScore,
    rationale: ot.rationale,
    userSelected: ot.userSelected,
  }));
}

/**
 * Update tool selection status
 */
export async function updateToolSelection(
  opportunityId: string,
  toolId: string,
  userSelected: boolean
): Promise<void> {
  await db.opportunityTool.update({
    where: {
      opportunityId_toolId: {
        opportunityId,
        toolId,
      },
    },
    data: {
      userSelected,
    },
  });
}
