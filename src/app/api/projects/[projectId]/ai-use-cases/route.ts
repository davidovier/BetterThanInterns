import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyProjectAccess } from '@/lib/access-control';

const manualCreateSchema = z.object({
  mode: z.literal('manual'),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['planned', 'pilot', 'production', 'paused']).default('planned'),
  owner: z.string().optional(),
});

const blueprintCreateSchema = z.object({
  mode: z.literal('from_blueprint'),
  blueprintId: z.string(),
});

const createSchema = z.union([manualCreateSchema, blueprintCreateSchema]);

/**
 * POST /api/projects/[projectId]/ai-use-cases
 * Create a new AI use case for a project
 */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify project access
    const hasAccess = await verifyProjectAccess(params.projectId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this project');
    }

    // Get project with workspace
    const project = await db.project.findUnique({
      where: { id: params.projectId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
      },
    });

    if (!project) {
      return CommonErrors.notFound('Project');
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    let aiUseCase;

    if (data.mode === 'manual') {
      // Manual creation
      const metadata = {
        processCount: 0,
        opportunityCount: 0,
        toolCount: 0,
      };

      aiUseCase = await db.aiUseCase.create({
        data: {
          workspaceId: project.workspaceId,
          projectId: params.projectId,
          title: data.title,
          description: data.description,
          status: data.status,
          owner: data.owner,
          source: 'manual',
          linkedProcessIds: [],
          linkedOpportunityIds: [],
          linkedToolIds: [],
          metadataJson: metadata,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // From blueprint
      const blueprint = await db.blueprint.findUnique({
        where: { id: data.blueprintId },
        include: {
          project: {
            include: {
              processes: {
                include: {
                  opportunities: {
                    include: {
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
          },
        },
      });

      if (!blueprint) {
        return CommonErrors.notFound('Blueprint');
      }

      if (blueprint.projectId !== params.projectId) {
        return CommonErrors.forbidden('Blueprint does not belong to this project');
      }

      // Extract linked IDs from blueprint
      const contentJson = blueprint.contentJson as any;
      const linkedProcessIds = blueprint.project.processes.map((p) => p.id);

      const linkedOpportunityIds: string[] = [];
      const linkedToolIds: string[] = [];

      blueprint.project.processes.forEach((process) => {
        process.opportunities.forEach((opp) => {
          linkedOpportunityIds.push(opp.id);
          opp.opportunityTools.forEach((ot) => {
            if (!linkedToolIds.includes(ot.toolId)) {
              linkedToolIds.push(ot.toolId);
            }
          });
        });
      });

      const metadata = {
        processCount: linkedProcessIds.length,
        opportunityCount: linkedOpportunityIds.length,
        toolCount: linkedToolIds.length,
      };

      const title = contentJson.title || `AI Implementation – ${project.name}`;
      const description =
        contentJson.executiveSummary ||
        `Implementation plan for ${project.name} based on mapped processes and identified automation opportunities.`;

      aiUseCase = await db.aiUseCase.create({
        data: {
          workspaceId: project.workspaceId,
          projectId: params.projectId,
          blueprintId: data.blueprintId,
          title,
          description,
          status: 'planned',
          source: 'blueprint',
          linkedProcessIds,
          linkedOpportunityIds,
          linkedToolIds,
          metadataJson: metadata,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          blueprint: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    return ok({ aiUseCase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create AI use case', error, { projectId: params.projectId });
    return CommonErrors.internalError('Failed to create AI use case');
  }
}
