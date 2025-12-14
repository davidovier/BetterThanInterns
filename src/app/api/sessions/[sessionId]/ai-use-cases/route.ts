import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import OpenAI from 'openai';
import { chatCompletionWithBilling } from '@/lib/aiWrapper';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * GET /api/sessions/[sessionId]/ai-use-cases
 * Get all AI use cases for a session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Get session and verify access
    const assistantSession = await db.assistantSession.findFirst({
      where: {
        id: params.sessionId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!assistantSession) {
      return CommonErrors.notFound('Session');
    }

    // Load all AI use cases for this session
    const aiUseCases = await db.aiUseCase.findMany({
      where: {
        sessionId: params.sessionId,
        workspaceId: assistantSession.workspaceId,
      },
      include: {
        riskAssessment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ok({ aiUseCases });
  } catch (error) {
    logError('Get session AI use cases', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to load AI use cases');
  }
}

/**
 * POST /api/sessions/[sessionId]/ai-use-cases
 * Create a new AI use case for a session
 *
 * Body:
 * - title: string (optional, will be generated if not provided)
 * - description?: string (optional, will be generated if not provided)
 * - processIds?: string[] (optional, processes to link)
 * - opportunityIds?: string[] (optional, opportunities to link)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const body = await req.json();
    const {
      title,
      description,
      processIds = [],
      opportunityIds = [],
    } = body;

    // Get session and verify access
    const assistantSession = await db.assistantSession.findFirst({
      where: {
        id: params.sessionId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        workspaceId: true,
        metadata: true,
      },
    });

    if (!assistantSession) {
      return CommonErrors.notFound('Session');
    }

    // Load referenced processes and opportunities
    const [processes, opportunities] = await Promise.all([
      processIds.length > 0
        ? db.process.findMany({
            where: {
              id: { in: processIds },
              workspaceId: assistantSession.workspaceId,
            },
            include: {
              steps: {
                orderBy: { createdAt: 'asc' },
              },
            },
          })
        : Promise.resolve([]),
      opportunityIds.length > 0
        ? db.opportunity.findMany({
            where: {
              id: { in: opportunityIds },
            },
            include: {
              process: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    let useCaseTitle = title;
    let useCaseDescription = description;
    let riskSummary = '';

    // If title or description not provided, generate using OpenAI
    if (!title || !description) {
      const prompt = `You are an AI governance expert helping document AI use cases.

${processes.length > 0 ? `
Processes:
${processes.map((p) => `
Process: ${p.name}
${p.description ? `Description: ${p.description}` : ''}
Steps: ${p.steps.map((s) => s.title).join(' → ')}
`).join('\n')}
` : ''}

${opportunities.length > 0 ? `
Automation Opportunities:
${opportunities.map((o) => `
- ${o.title} (${o.opportunityType}, ${o.impactLevel} impact)
  ${o.description}
`).join('\n')}
` : ''}

Create an AI use case documentation with:
1. A concise title (5-10 words)
2. A clear description (2-3 sentences) of what the AI will do
3. A brief risk summary (1-2 sentences) highlighting key considerations

Return as JSON:
{
  "title": "...",
  "description": "...",
  "riskSummary": "..."
}`;

      const result = await chatCompletionWithBilling(
        assistantSession.workspaceId,
        'GOVERNANCE_REASONING',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert AI governance consultant. Create clear, professional AI use case documentation. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }
      );

      if (!result.success) {
        throw result.error;
      }

      const completion = result.data;
      const generated = JSON.parse(
        completion.choices[0]?.message?.content || '{}'
      );
      useCaseTitle = title || generated.title || 'AI Use Case';
      useCaseDescription = description || generated.description || '';
      riskSummary = generated.riskSummary || '';
    }

    // Create AI use case
    const aiUseCase = await db.aiUseCase.create({
      data: {
        workspaceId: assistantSession.workspaceId,
        sessionId: params.sessionId,
        title: useCaseTitle,
        description: useCaseDescription,
        riskSummary,
        status: 'idea',
        source: 'blueprint',
        linkedProcessIds: processIds,
        linkedOpportunityIds: opportunityIds,
        metadataJson: {
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Update session metadata to track this AI use case
    const currentMetadata = (assistantSession.metadata as any) || {};
    const aiUseCaseIds = currentMetadata.aiUseCaseIds || [];

    await db.assistantSession.update({
      where: { id: params.sessionId },
      data: {
        metadata: {
          ...currentMetadata,
          aiUseCaseIds: [...aiUseCaseIds, aiUseCase.id],
        },
      },
    });

    return ok({ aiUseCase });
  } catch (error) {
    logError('Create session AI use case', error, {
      sessionId: params.sessionId,
    });
    return CommonErrors.internalError('Failed to create AI use case');
  }
}
