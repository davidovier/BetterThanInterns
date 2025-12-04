/**
 * Governance Flow Action Handler
 *
 * Creates AI use cases and optionally drafts risk assessments and policy mappings.
 */

import { db } from '@/lib/db';
import { openai } from '@/lib/llm';
import { CreateUseCaseParams } from '../types';

export async function createAiUseCase(
  params: CreateUseCaseParams,
  options?: {
    draftRiskAssessment?: boolean;
    suggestPolicies?: boolean;
  }
): Promise<{
  useCaseId: string;
  riskAssessmentId?: string;
}> {
  try {
    // Create AI use case
    const aiUseCase = await db.aiUseCase.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        title: params.title,
        description: params.description,
        source: 'assistant_session',
        status: 'draft',
        linkedProcessIds: params.linkedProcessIds || [],
        linkedOpportunityIds: params.linkedOpportunityIds || [],
        linkedToolIds: [],
      },
    });

    let riskAssessmentId: string | undefined;

    // Optionally draft risk assessment using LLM
    if (options?.draftRiskAssessment) {
      try {
        const riskAssessment = await draftRiskAssessment(aiUseCase.id, params);
        riskAssessmentId = riskAssessment.id;
      } catch (error) {
        console.error('Failed to draft risk assessment:', error);
        // Continue without risk assessment
      }
    }

    return {
      useCaseId: aiUseCase.id,
      riskAssessmentId,
    };
  } catch (error) {
    console.error('Error creating AI use case:', error);
    throw new Error('Failed to create AI use case');
  }
}

/**
 * Draft a risk assessment for an AI use case using LLM
 */
async function draftRiskAssessment(
  aiUseCaseId: string,
  params: CreateUseCaseParams
) {
  const systemPrompt = `You are an AI governance consultant. Given an AI use case, draft a structured risk & impact assessment.

You MUST be conservative and identify realistic risks, not just benefits. Consider:
- Data privacy and security risks
- Potential for bias or unfairness
- Operational dependencies and failure modes
- Compliance and regulatory requirements
- Business impact if the AI system fails or behaves unexpectedly

Return ONLY valid JSON with no additional text or markdown formatting.`;

  const userPrompt = `AI Use Case: ${params.title}
Description: ${params.description}

Please provide a conservative risk assessment in the following JSON format:

{
  "riskLevel": "low|medium|high|critical",
  "impactAreas": ["customers", "employees", "business", "compliance"],
  "dataSensitivity": "none|low|medium|high",
  "regulatoryRelevance": ["GDPR", "HIPAA", "SOC2"],
  "summaryText": "Plain-language summary of the risk profile.",
  "risks": [
    {
      "title": "Risk title",
      "description": "What could go wrong.",
      "mitigation": "How we reduce this risk."
    }
  ],
  "assumptions": [
    "Assumption 1",
    "Assumption 2"
  ],
  "residualRiskText": "Short paragraph describing remaining risk after mitigations."
}`;

  // Call LLM with JSON mode
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('Empty LLM response');
  }

  const parsed = JSON.parse(responseText);

  // Create risk assessment
  const riskAssessment = await db.aiRiskAssessment.create({
    data: {
      aiUseCaseId: aiUseCaseId,
      riskLevel: parsed.riskLevel,
      impactAreas: parsed.impactAreas,
      dataSensitivity: parsed.dataSensitivity || null,
      regulatoryRelevance: parsed.regulatoryRelevance,
      summaryText: parsed.summaryText,
      risksJson: parsed.risks,
      assumptionsJson: parsed.assumptions,
      residualRiskText: parsed.residualRiskText || null,
      draftedByAi: true,
      lastDraftedAt: new Date(),
    },
  });

  return riskAssessment;
}
