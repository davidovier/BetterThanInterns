import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { z } from 'zod';

const createBlueprintSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contentJson: z.any(),
  renderedMarkdown: z.string(),
  metadataJson: z.any().optional(),
});

/**
 * GET /api/workspaces/[workspaceId]/blueprints
 * List all blueprints in a workspace (across all projects)
 */
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    // Fetch all blueprints for this workspace
    const blueprints = await db.blueprint.findMany({
      where: {
        workspaceId: params.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedBlueprints = blueprints.map((blueprint) => {
      // Extract preview from markdown (first 200 chars)
      const preview = blueprint.renderedMarkdown
        ? blueprint.renderedMarkdown.substring(0, 200).replace(/[#*`]/g, '').trim()
        : '';

      return {
        id: blueprint.id,
        title: blueprint.title,
        preview,
        version: blueprint.version,
        createdAt: blueprint.createdAt,
        updatedAt: blueprint.updatedAt,
      };
    });

    return ok({ blueprints: formattedBlueprints });
  } catch (error) {
    logError('List blueprints', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to load blueprints');
  }
}

/**
 * POST /api/workspaces/[workspaceId]/blueprints
 * Create a new blueprint in a workspace
 */
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(params.workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this workspace');
    }

    const body = await req.json();
    const data = createBlueprintSchema.parse(body);

    const blueprint = await db.blueprint.create({
      data: {
        workspaceId: params.workspaceId,
        title: data.title,
        contentJson: data.contentJson,
        renderedMarkdown: data.renderedMarkdown,
        metadataJson: data.metadataJson || {},
        version: 1,
      },
    });

    return ok({ blueprint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create blueprint', error, { workspaceId: params.workspaceId });
    return CommonErrors.internalError('Failed to create blueprint');
  }
}
