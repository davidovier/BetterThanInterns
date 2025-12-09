/**
 * Session Overview Generation
 *
 * Generates a comprehensive structured summary of all artifacts in a session.
 */

import { db } from '@/lib/db';

export type GenerateOverviewParams = {
  sessionId: string;
  workspaceId: string;
};

export type SessionOverview = {
  overview: string; // Natural language summary
  processes: Array<{
    id: string;
    name: string;
    stepCount: number;
    linkCount: number;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    impactLevel: string;
    impactScore: number;
    feasibilityScore: number;
  }>;
  blueprints: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  aiUseCases: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

/**
 * Generate structured overview of all session artifacts
 */
export async function generateSessionOverview(
  params: GenerateOverviewParams
): Promise<SessionOverview> {
  const { sessionId, workspaceId } = params;

  // Fetch session to get metadata
  const session = await db.assistantSession.findUnique({
    where: { id: sessionId },
    select: { metadata: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const metadata = session.metadata as any;
  const processIds = metadata.processIds || [];
  const opportunityIds = metadata.opportunityIds || [];
  const blueprintIds = metadata.blueprintIds || [];
  const aiUseCaseIds = metadata.aiUseCaseIds || [];

  // Fetch all artifacts in parallel
  const [processes, opportunities, blueprints, aiUseCases] = await Promise.all([
    // Fetch processes with counts
    processIds.length > 0
      ? db.process.findMany({
          where: { id: { in: processIds }, workspaceId },
          include: {
            _count: {
              select: { steps: true, links: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [],

    // Fetch opportunities
    opportunityIds.length > 0
      ? db.opportunity.findMany({
          where: { id: { in: opportunityIds } },
          select: {
            id: true,
            title: true,
            impactLevel: true,
            impactScore: true,
            feasibilityScore: true,
          },
          orderBy: { impactScore: 'desc' },
        })
      : [],

    // Fetch blueprints
    blueprintIds.length > 0
      ? db.blueprint.findMany({
          where: { id: { in: blueprintIds }, workspaceId },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [],

    // Fetch AI use cases
    aiUseCaseIds.length > 0
      ? db.aiUseCase.findMany({
          where: { id: { in: aiUseCaseIds }, workspaceId },
          select: {
            id: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [],
  ]);

  // Build structured overview data
  const overview: SessionOverview = {
    overview: buildOverviewText({
      processCount: processes.length,
      opportunityCount: opportunities.length,
      blueprintCount: blueprints.length,
      aiUseCaseCount: aiUseCases.length,
    }),
    processes: processes.map((p) => ({
      id: p.id,
      name: p.name,
      stepCount: p._count.steps,
      linkCount: p._count.links,
    })),
    opportunities: opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      impactLevel: o.impactLevel,
      impactScore: o.impactScore,
      feasibilityScore: o.feasibilityScore,
    })),
    blueprints: blueprints.map((b) => ({
      id: b.id,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
    })),
    aiUseCases: aiUseCases.map((u) => ({
      id: u.id,
      title: u.title,
      status: u.status,
    })),
  };

  return overview;
}

/**
 * Build natural language overview text
 */
function buildOverviewText(counts: {
  processCount: number;
  opportunityCount: number;
  blueprintCount: number;
  aiUseCaseCount: number;
}): string {
  const { processCount, opportunityCount, blueprintCount, aiUseCaseCount } = counts;
  const parts: string[] = [];

  if (processCount === 0 && opportunityCount === 0 && blueprintCount === 0 && aiUseCaseCount === 0) {
    return "This session doesn't have any artifacts yet. Let's start by mapping a business process!";
  }

  parts.push('## Session Overview\n');

  if (processCount > 0) {
    parts.push(
      `**${processCount} Process${processCount > 1 ? 'es' : ''}** mapped with detailed workflow steps`
    );
  }

  if (opportunityCount > 0) {
    parts.push(
      `**${opportunityCount} AI Opportunit${opportunityCount > 1 ? 'ies' : 'y'}** identified for automation`
    );
  }

  if (blueprintCount > 0) {
    parts.push(
      `**${blueprintCount} Blueprint${blueprintCount > 1 ? 's' : ''}** created with implementation plans`
    );
  }

  if (aiUseCaseCount > 0) {
    parts.push(
      `**${aiUseCaseCount} AI Use Case${aiUseCaseCount > 1 ? 's' : ''}** registered for governance tracking`
    );
  }

  return parts.join('\n\n');
}
