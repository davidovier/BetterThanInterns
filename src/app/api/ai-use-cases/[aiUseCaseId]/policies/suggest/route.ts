import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, error, ErrorCodes, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { openai } from '@/lib/llm';

/**
 * POST /api/ai-use-cases/[aiUseCaseId]/policies/suggest
 * Use GPT-4o to suggest relevant policies for this AI use case
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

    // Fetch AI use case with context
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
        riskAssessment: {
          select: {
            riskLevel: true,
            dataSensitivity: true,
            regulatoryRelevance: true,
            summaryText: true,
          },
        },
        project: {
          select: {
            name: true,
            description: true,
            industry: true,
          },
        },
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    // Fetch workspace policies
    const policies = await db.aiPolicy.findMany({
      where: {
        workspaceId: aiUseCase.workspaceId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    if (policies.length === 0) {
      return ok({
        suggestedPolicyIds: [],
        rationales: [],
        policies: [],
      });
    }

    // Build LLM prompt
    const systemPrompt = `You are an AI governance consultant. Based on this AI use case and the policy library, suggest which policies are relevant and why.

Be conservative and prefer to include policies if in doubt. Consider:
- The nature of the AI system and what it does
- Data sensitivity and privacy implications
- Regulatory requirements based on industry and geography
- Security and ethical considerations
- Operational governance needs

Return ONLY valid JSON with no additional text or markdown formatting.`;

    const userPromptParts = [
      `AI Use Case: ${aiUseCase.title}`,
      `Description: ${aiUseCase.description}`,
      `Status: ${aiUseCase.status}`,
      `Source: ${aiUseCase.source}`,
    ];

    if (aiUseCase.project.industry) {
      userPromptParts.push(`Industry: ${aiUseCase.project.industry}`);
    }

    if (aiUseCase.riskAssessment) {
      userPromptParts.push(
        `Risk Level: ${aiUseCase.riskAssessment.riskLevel}`,
        `Data Sensitivity: ${aiUseCase.riskAssessment.dataSensitivity || 'unknown'}`,
        `Regulatory Relevance: ${(aiUseCase.riskAssessment.regulatoryRelevance as string[]).join(', ') || 'none specified'}`,
        `Risk Summary: ${aiUseCase.riskAssessment.summaryText}`
      );
    }

    userPromptParts.push('\nAvailable policies:');
    policies.forEach((policy, idx) => {
      userPromptParts.push(
        `${idx + 1}) id: ${policy.id}`,
        `   key: ${policy.key}`,
        `   name: ${policy.name}`,
        `   category: ${policy.category}`,
        `   description: ${policy.description}`,
        ''
      );
    });

    userPromptParts.push(`
Please provide policy suggestions in the following JSON format:

{
  "suggestedPolicyIds": ["policy-id-1", "policy-id-2"],
  "rationales": [
    {
      "policyId": "policy-id-1",
      "reason": "Short explanation of why this policy is relevant."
    }
  ]
}`);

    const userPrompt = userPromptParts.join('\n');

    // Call LLM with JSON mode
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty LLM response');
    }

    // Parse and validate LLM output
    const suggestSchema = z.object({
      suggestedPolicyIds: z.array(z.string()),
      rationales: z.array(
        z.object({
          policyId: z.string(),
          reason: z.string(),
        })
      ),
    });

    let parsed;
    try {
      parsed = JSON.parse(responseText);
      suggestSchema.parse(parsed);
    } catch (parseError) {
      logError('Parse LLM policy suggestion', parseError, {
        aiUseCaseId: params.aiUseCaseId,
        responseText,
      });
      return error(500, ErrorCodes.INTERNAL_ERROR, 'LLM returned invalid format');
    }

    // Filter policies to only include suggested ones
    const suggestedPolicies = policies.filter((p) =>
      parsed.suggestedPolicyIds.includes(p.id)
    );

    return ok({
      suggestedPolicyIds: parsed.suggestedPolicyIds,
      rationales: parsed.rationales,
      policies: suggestedPolicies,
    });
  } catch (error: any) {
    // Handle OpenAI API errors
    if (error.error?.type) {
      logError('OpenAI API error', error, { aiUseCaseId: params.aiUseCaseId });
      return error(500, ErrorCodes.INTERNAL_ERROR, 'AI service temporarily unavailable');
    }

    logError('Suggest policies', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to suggest policies');
  }
}
