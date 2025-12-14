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
 * GET /api/sessions/[sessionId]/blueprints
 * Get all blueprints for a session
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

    // Load all blueprints for this session
    const blueprints = await db.blueprint.findMany({
      where: {
        sessionId: params.sessionId,
        workspaceId: assistantSession.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ok({ blueprints });
  } catch (error) {
    logError('Get session blueprints', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to load blueprints');
  }
}

/**
 * POST /api/sessions/[sessionId]/blueprints
 * Create a new blueprint for a session
 *
 * Body:
 * - title: string (optional, will be generated if not provided)
 * - processIds?: string[] (optional, processes to include in blueprint)
 * - opportunityIds?: string[] (optional, opportunities to include in blueprint)
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
    const { title, processIds = [], opportunityIds = [] } = body;

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
              step: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Generate blueprint using OpenAI
    const prompt = `You are an AI implementation consultant helping create an implementation blueprint.

${processes.length > 0 ? `
Processes:
${processes.map((p) => `
Process: ${p.name}
${p.description ? `Description: ${p.description}` : ''}
Steps:
${p.steps.map((s) => `  - ${s.title}${s.description ? ` - ${s.description}` : ''}`).join('\n')}
`).join('\n')}
` : ''}

${opportunities.length > 0 ? `
Automation Opportunities:
${opportunities.map((o) => `
Title: ${o.title}
Type: ${o.opportunityType}
Impact: ${o.impactLevel}
Description: ${o.description}
Rationale: ${o.rationaleText}
`).join('\n')}
` : ''}

Create a comprehensive implementation blueprint in markdown format that includes:

1. **Executive Summary** - Brief overview (2-3 sentences)
2. **Current State Analysis** - Summary of processes and pain points
3. **AI/Automation Opportunities** - List of identified opportunities with impact
4. **Implementation Roadmap** - Phased approach (Quick Wins, Mid-term, Long-term)
5. **Tool Recommendations** - Suggested tools/platforms
6. **Success Metrics** - KPIs to track
7. **Next Steps** - Immediate actions

Keep it concise but actionable. Use clear headers and bullet points.`;

    const result = await chatCompletionWithBilling(
      assistantSession.workspaceId,
      'BLUEPRINT_GENERATION',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI implementation consultant. Create clear, actionable implementation blueprints in markdown format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }
    );

    if (!result.success) {
      throw result.error;
    }

    const completion = result.data;
    const blueprintMarkdown = completion.choices[0]?.message?.content || '';

    // Generate title if not provided
    const blueprintTitle =
      title ||
      `Implementation Blueprint - ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

    // Extract summary (first paragraph after exec summary header)
    const summaryMatch = blueprintMarkdown.match(/##\s*Executive Summary\s*\n\n([^\n]+)/i);
    const summary = summaryMatch ? summaryMatch[1] : '';

    // Create blueprint
    const blueprint = await db.blueprint.create({
      data: {
        workspaceId: assistantSession.workspaceId,
        sessionId: params.sessionId,
        title: blueprintTitle,
        summary,
        contentMarkdown: blueprintMarkdown,
        renderedMarkdown: blueprintMarkdown, // Could use a markdown renderer here
        contentJson: {
          processes: processes.map((p) => ({ id: p.id, name: p.name })),
          opportunities: opportunities.map((o) => ({
            id: o.id,
            title: o.title,
            type: o.opportunityType,
          })),
          generatedAt: new Date().toISOString(),
        },
        metadataJson: {
          processCount: processes.length,
          opportunityCount: opportunities.length,
        },
      },
    });

    // Update session metadata to track this blueprint
    const currentMetadata = (assistantSession.metadata as any) || {};
    const blueprintIds = currentMetadata.blueprintIds || [];

    await db.assistantSession.update({
      where: { id: params.sessionId },
      data: {
        metadata: {
          ...currentMetadata,
          blueprintIds: [...blueprintIds, blueprint.id],
        },
      },
    });

    return ok({ blueprint });
  } catch (error) {
    logError('Create session blueprint', error, { sessionId: params.sessionId });
    return CommonErrors.internalError('Failed to create blueprint');
  }
}
