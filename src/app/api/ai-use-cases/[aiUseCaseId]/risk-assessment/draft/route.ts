import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors, error, ErrorCodes } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { openai } from '@/lib/llm';

/**
 * POST /api/ai-use-cases/[aiUseCaseId]/risk-assessment/draft
 * Ask LLM to draft a risk assessment for this AI use case
 */
export async function POST(
  req: Request,
  { params }: { params: { aiUseCaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Fetch AI use case with context (blueprint if exists)
    const aiUseCase = await db.aiUseCase.findFirst({
      where: {
        id: params.aiUseCaseId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        blueprint: {
          select: {
            id: true,
            title: true,
            contentJson: true,
          },
        },
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    // Build prompt context
    const systemPrompt = `You are an AI governance consultant. Given an AI use case, draft a structured risk & impact assessment.

You MUST be conservative and identify realistic risks, not just benefits. Consider:
- Data privacy and security risks
- Potential for bias or unfairness
- Operational dependencies and failure modes
- Compliance and regulatory requirements
- Business impact if the AI system fails or behaves unexpectedly

Return ONLY valid JSON with no additional text or markdown formatting.`;

    const userPromptParts = [
      `AI Use Case: ${aiUseCase.title}`,
      `Description: ${aiUseCase.description}`,
      `Status: ${aiUseCase.status}`,
      `Source: ${aiUseCase.source}`,
    ];

    const linkedProcessCount = (aiUseCase.linkedProcessIds as string[]).length || 0;
    const linkedOppCount = (aiUseCase.linkedOpportunityIds as string[]).length || 0;
    const linkedToolCount = (aiUseCase.linkedToolIds as string[]).length || 0;

    userPromptParts.push(
      `This use case involves ${linkedProcessCount} process(es), ${linkedOppCount} automation opportunit(ies), and ${linkedToolCount} tool(s).`
    );

    userPromptParts.push(`
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
}`);

    const userPrompt = userPromptParts.join('\n\n');

    // Call LLM with JSON mode
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more conservative/consistent output
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty LLM response');
    }

    // Parse and validate LLM output
    const draftSchema = z.object({
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
      impactAreas: z.array(z.string()),
      dataSensitivity: z.enum(['none', 'low', 'medium', 'high']).nullable(),
      regulatoryRelevance: z.array(z.string()),
      summaryText: z.string().min(1),
      risks: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          mitigation: z.string(),
        })
      ),
      assumptions: z.array(z.string()),
      residualRiskText: z.string().nullable(),
    });

    let parsed;
    try {
      parsed = JSON.parse(responseText);
      draftSchema.parse(parsed);
    } catch (parseError) {
      logError('Parse LLM risk draft', parseError, {
        aiUseCaseId: params.aiUseCaseId,
        responseText,
      });
      return error(500, ErrorCodes.INTERNAL_ERROR, 'LLM returned invalid format');
    }

    // Upsert risk assessment with drafted content
    const riskAssessment = await db.aiRiskAssessment.upsert({
      where: {
        aiUseCaseId: params.aiUseCaseId,
      },
      update: {
        riskLevel: parsed.riskLevel,
        impactAreas: parsed.impactAreas,
        dataSensitivity: parsed.dataSensitivity,
        regulatoryRelevance: parsed.regulatoryRelevance,
        summaryText: parsed.summaryText,
        risksJson: parsed.risks,
        assumptionsJson: parsed.assumptions,
        residualRiskText: parsed.residualRiskText,
        draftedByAi: true,
        lastDraftedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        aiUseCaseId: params.aiUseCaseId,
        riskLevel: parsed.riskLevel,
        impactAreas: parsed.impactAreas,
        dataSensitivity: parsed.dataSensitivity,
        regulatoryRelevance: parsed.regulatoryRelevance,
        summaryText: parsed.summaryText,
        risksJson: parsed.risks,
        assumptionsJson: parsed.assumptions,
        residualRiskText: parsed.residualRiskText,
        draftedByAi: true,
        lastDraftedAt: new Date(),
      },
    });

    return ok({ riskAssessment });
  } catch (error: any) {
    // Handle OpenAI API errors
    if (error.error?.type) {
      logError('OpenAI API error', error, { aiUseCaseId: params.aiUseCaseId });
      return error(500, ErrorCodes.INTERNAL_ERROR, 'AI service temporarily unavailable');
    }

    logError('Draft risk assessment', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to draft risk assessment');
  }
}
