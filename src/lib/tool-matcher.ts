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
import { chatCompletionWithBilling } from './aiWrapper';

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
 * Uses GPT-4o to intelligently analyze and rank tools
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

    // Use GPT-4o to intelligently match and rank tools
    // Get workspace ID from opportunity's process
    const process = await db.process.findUniqueOrThrow({
      where: { id: opportunity.processId },
      select: { workspaceId: true },
    });
    const toolMatches = await intelligentToolMatching(process.workspaceId, opportunity, allTools);

    // Store recommendations in database
    const recommendations: ToolRecommendation[] = [];

    for (const match of toolMatches) {
      // Upsert OpportunityTool record
      const oppTool = await db.opportunityTool.upsert({
        where: {
          opportunityId_toolId: {
            opportunityId: opportunityId,
            toolId: match.toolId,
          },
        },
        create: {
          opportunityId: opportunityId,
          toolId: match.toolId,
          matchScore: match.score,
          rationale: match.rationale,
          userSelected: false,
        },
        update: {
          matchScore: match.score,
          rationale: match.rationale,
        },
      });

      const tool = allTools.find((t) => t.id === match.toolId)!;
      recommendations.push({
        toolId: tool.id,
        name: tool.name,
        vendor: tool.vendor,
        category: tool.category,
        description: tool.description,
        pricingTier: tool.pricingTier,
        integrationComplexity: tool.integrationComplexity,
        websiteUrl: tool.websiteUrl,
        matchScore: match.score,
        rationale: match.rationale,
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
 * Use GPT-4o to intelligently analyze and match tools to the opportunity
 */
async function intelligentToolMatching(
  workspaceId: string,
  opportunity: any,
  allTools: any[]
): Promise<Array<{ toolId: string; score: number; rationale: string }>> {
  try {
    // Build a concise tool catalog for the LLM
    const toolCatalog = allTools.map((tool, index) => ({
      index,
      id: tool.id,
      name: tool.name,
      category: tool.category,
      description: tool.description.substring(0, 200), // Truncate long descriptions
      useCases: tool.useCases,
      pricingTier: tool.pricingTier,
      integrationComplexity: tool.integrationComplexity,
    }));

    const systemPrompt = `You are an expert AI consultant specializing in automation and AI tool selection.
Your job is to analyze an automation opportunity and recommend the BEST matching tools from the available catalog.

Guidelines:
- Only recommend tools that are ACTUALLY suitable for the specific opportunity
- Consider the opportunity type, description, impact level, and effort level
- Prioritize tools that match the use case and have appropriate complexity/pricing
- Provide a clear rationale for each recommendation
- Return 2-5 tools maximum (only the best matches)
- If no tools are truly suitable, return fewer recommendations

Return a JSON array of recommendations, each with:
{
  "toolId": "the tool ID from the catalog",
  "score": 0.0-1.0 (how well it matches),
  "rationale": "2-3 sentences explaining why this tool fits this specific opportunity"
}`;

    const userPrompt = `Analyze this automation opportunity and recommend the best tools:

OPPORTUNITY:
Title: ${opportunity.title}
Type: ${opportunity.opportunityType}
Description: ${opportunity.description}
Impact Level: ${opportunity.impactLevel}
Effort Level: ${opportunity.effortLevel}
Rationale: ${opportunity.rationaleText}
${opportunity.step ? `Process Step: ${opportunity.step.title}` : ''}

AVAILABLE TOOLS:
${JSON.stringify(toolCatalog, null, 2)}

Return a JSON array of tool recommendations (2-5 best matches only):`;

    const result = await chatCompletionWithBilling(
      workspaceId,
      'TOOL_MATCHING',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent recommendations
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }
    );

    if (!result.success) {
      throw result.error;
    }

    const response = result.data;
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty response for tool matching');
    }

    const parsed = JSON.parse(content);

    // Handle both array and object with recommendations array
    const recommendations = Array.isArray(parsed) ? parsed : (parsed.recommendations || []);

    // Validate and return recommendations
    return recommendations
      .filter((rec: any) => rec.toolId && rec.score && rec.rationale)
      .slice(0, 5) // Max 5 tools
      .map((rec: any) => ({
        toolId: rec.toolId,
        score: Math.max(0, Math.min(1, rec.score)), // Clamp to 0-1
        rationale: rec.rationale,
      }));
  } catch (error) {
    console.error('Error in intelligent tool matching:', error);
    // Fallback to simple category-based matching
    return fallbackToolMatching(opportunity, allTools);
  }
}

/**
 * Fallback matching if LLM fails
 */
function fallbackToolMatching(
  opportunity: any,
  allTools: any[]
): Array<{ toolId: string; score: number; rationale: string }> {
  const relevantCategories = CATEGORY_MAPPING[opportunity.opportunityType] || [];

  return allTools
    .filter((tool) => relevantCategories.includes(tool.category))
    .slice(0, 3)
    .map((tool) => ({
      toolId: tool.id,
      score: 0.6,
      rationale: `${tool.name} is a ${tool.category} tool suitable for ${opportunity.opportunityType} opportunities.`,
    }));
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
