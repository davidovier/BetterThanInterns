/**
 * Blueprint Generator
 *
 * Generates implementation blueprints for automation projects using LLM.
 */

import { openai } from './llm';
import { db } from './db';

export type BlueprintContent = {
  title: string;
  executiveSummary: string;
  currentState: string;
  targetState: string;
  opportunities: Array<{
    id: string;
    title: string;
    summary: string;
    selectedTools: string[];
  }>;
  phases: Array<{
    name: string;
    duration: string;
    objectives: string[];
    activities: string[];
    tools: string[];
    dependencies: string[];
    deliverables: string[];
  }>;
  risks: Array<{
    name: string;
    mitigation: string;
  }>;
  kpis: Array<{
    name: string;
    baseline: string;
    target: string;
  }>;
};

const SYSTEM_PROMPT = `You are an expert AI consultant creating implementation blueprints for business automation projects.

Your role is to analyze a project's processes, opportunities, and selected tools, then create a comprehensive implementation blueprint.

The blueprint should:
1. Provide an executive summary suitable for C-level stakeholders
2. Describe current state and target state clearly
3. Group opportunities logically
4. Define 3-5 implementation phases with clear timelines
5. Identify realistic risks and practical mitigations
6. Suggest measurable KPIs

You MUST return ONLY valid JSON in this exact structure:
{
  "title": "AI Implementation Blueprint for [Project Name]",
  "executiveSummary": "2-3 paragraphs summarizing the transformation, expected benefits, and timeline",
  "currentState": "1-2 paragraphs describing current processes and pain points",
  "targetState": "1-2 paragraphs describing the automated future state",
  "opportunities": [
    {
      "id": "opportunity-id",
      "title": "Opportunity title",
      "summary": "What this automation achieves and how",
      "selectedTools": ["Tool A", "Tool B"]
    }
  ],
  "phases": [
    {
      "name": "Phase 1 – Foundation & Quick Wins",
      "duration": "4-6 weeks",
      "objectives": ["Objective 1", "Objective 2"],
      "activities": ["Activity 1", "Activity 2"],
      "tools": ["Tool names to implement"],
      "dependencies": ["What must be done first"],
      "deliverables": ["Concrete outputs"]
    }
  ],
  "risks": [
    {
      "name": "Risk name",
      "mitigation": "How to address it"
    }
  ],
  "kpis": [
    {
      "name": "KPI name",
      "baseline": "Current measurement",
      "target": "Target after implementation"
    }
  ]
}

Be specific, actionable, and realistic. Use actual tool names and process details provided.`;

/**
 * Generate blueprint for a project
 */
export async function generateBlueprintForProject(
  projectId: string
): Promise<{ blueprint: any; contentJson: BlueprintContent; renderedMarkdown: string }> {
  try {
    // Load all project context
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        processes: {
          include: {
            steps: true,
            opportunities: {
              include: {
                step: true,
                opportunityTools: {
                  where: { userSelected: true },
                  include: {
                    tool: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Build compact LLM input
    const contextSummary = buildContextSummary(project);

    // Call LLM
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create an implementation blueprint for this project:\n\n${contextSummary}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in LLM response');
    }

    const contentJson = JSON.parse(content) as BlueprintContent;

    // Validate basic structure
    if (
      !contentJson.title ||
      !contentJson.executiveSummary ||
      !contentJson.phases ||
      !Array.isArray(contentJson.phases)
    ) {
      throw new Error('Invalid blueprint structure from LLM');
    }

    // Generate markdown
    const renderedMarkdown = generateMarkdown(contentJson);

    // Create Blueprint record
    const blueprint = await db.blueprint.create({
      data: {
        projectId: projectId,
        title: contentJson.title,
        contentJson: contentJson as any,
        renderedMarkdown: renderedMarkdown,
        version: 1,
        metadataJson: {
          processCount: project.processes.length,
          opportunityCount: project.processes.reduce(
            (sum, p) => sum + p.opportunities.length,
            0
          ),
          selectedToolCount: project.processes.reduce(
            (sum, p) =>
              sum +
              p.opportunities.reduce(
                (oSum, opp) => oSum + opp.opportunityTools.filter((ot) => ot.userSelected).length,
                0
              ),
            0
          ),
        },
      },
    });

    return { blueprint, contentJson, renderedMarkdown };
  } catch (error) {
    console.error('Error generating blueprint:', error);
    throw error;
  }
}

/**
 * Build compact context summary for LLM
 */
function buildContextSummary(project: any): string {
  let summary = `PROJECT OVERVIEW:\n`;
  summary += `- Name: ${project.name}\n`;
  if (project.description) summary += `- Description: ${project.description}\n`;
  if (project.clientName) summary += `- Client: ${project.clientName}\n`;
  if (project.industry) summary += `- Industry: ${project.industry}\n`;
  summary += `\n`;

  summary += `PROCESSES (${project.processes.length}):\n`;
  for (const process of project.processes) {
    summary += `\n${process.name}:\n`;
    if (process.description) summary += `  Description: ${process.description}\n`;
    summary += `  Steps: ${process.steps.length}\n`;
    summary += `  Opportunities: ${process.opportunities.length}\n`;
  }
  summary += `\n`;

  summary += `OPPORTUNITIES WITH SELECTED TOOLS:\n`;
  let oppCount = 0;
  for (const process of project.processes) {
    for (const opp of process.opportunities) {
      const selectedTools = opp.opportunityTools.filter((ot: any) => ot.userSelected);
      if (selectedTools.length > 0) {
        oppCount++;
        summary += `\n${oppCount}. ${opp.title} (${process.name})\n`;
        summary += `   Impact: ${opp.impactLevel} (${opp.impactScore}/100)\n`;
        summary += `   Effort: ${opp.effortLevel}\n`;
        if (opp.step) summary += `   Step: ${opp.step.title}\n`;
        summary += `   Rationale: ${opp.rationaleText.substring(0, 200)}...\n`;
        summary += `   Selected Tools:\n`;
        for (const ot of selectedTools) {
          summary += `   - ${ot.tool.name} (${ot.tool.category}): ${ot.tool.description.substring(0, 100)}...\n`;
        }
      }
    }
  }

  if (oppCount === 0) {
    summary += `No opportunities with selected tools yet.\n`;
  }

  return summary;
}

/**
 * Generate markdown from blueprint content
 */
function generateMarkdown(content: BlueprintContent): string {
  let md = `# ${content.title}\n\n`;

  md += `## Executive Summary\n\n${content.executiveSummary}\n\n`;

  md += `## Current State\n\n${content.currentState}\n\n`;

  md += `## Target State\n\n${content.targetState}\n\n`;

  md += `## Opportunities & Selected Tools\n\n`;
  for (const opp of content.opportunities || []) {
    md += `### ${opp.title}\n\n`;
    md += `${opp.summary}\n\n`;
    if (opp.selectedTools && opp.selectedTools.length > 0) {
      md += `**Recommended Tools:**\n`;
      for (const tool of opp.selectedTools) {
        md += `- ${tool}\n`;
      }
      md += `\n`;
    }
  }

  md += `## Implementation Phases\n\n`;
  for (const phase of content.phases || []) {
    md += `### ${phase.name}\n\n`;
    md += `**Duration:** ${phase.duration}\n\n`;

    if (phase.objectives && phase.objectives.length > 0) {
      md += `**Objectives:**\n`;
      for (const obj of phase.objectives) {
        md += `- ${obj}\n`;
      }
      md += `\n`;
    }

    if (phase.activities && phase.activities.length > 0) {
      md += `**Key Activities:**\n`;
      for (const activity of phase.activities) {
        md += `- ${activity}\n`;
      }
      md += `\n`;
    }

    if (phase.tools && phase.tools.length > 0) {
      md += `**Tools:**\n`;
      for (const tool of phase.tools) {
        md += `- ${tool}\n`;
      }
      md += `\n`;
    }

    if (phase.dependencies && phase.dependencies.length > 0) {
      md += `**Dependencies:**\n`;
      for (const dep of phase.dependencies) {
        md += `- ${dep}\n`;
      }
      md += `\n`;
    }

    if (phase.deliverables && phase.deliverables.length > 0) {
      md += `**Deliverables:**\n`;
      for (const deliverable of phase.deliverables) {
        md += `- ${deliverable}\n`;
      }
      md += `\n`;
    }
  }

  md += `## Risks & Mitigations\n\n`;
  for (const risk of content.risks || []) {
    md += `### ${risk.name}\n\n`;
    md += `**Mitigation:** ${risk.mitigation}\n\n`;
  }

  md += `## Key Performance Indicators\n\n`;
  md += `| KPI | Baseline | Target |\n`;
  md += `|-----|----------|--------|\n`;
  for (const kpi of content.kpis || []) {
    md += `| ${kpi.name} | ${kpi.baseline} | ${kpi.target} |\n`;
  }
  md += `\n`;

  md += `---\n\n`;
  md += `*Generated with Better Than Interns*\n`;

  return md;
}
