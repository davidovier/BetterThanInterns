import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateBlueprintForProject } from '@/lib/blueprint-generator';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    const { projectId } = params;

    // Verify user has access to this project via workspace
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
              },
            },
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      return CommonErrors.notFound('Project', 'Project not found or access denied');
    }

    // Generate blueprint using LLM
    const { blueprint, contentJson, renderedMarkdown } = await generateBlueprintForProject(projectId);

    return ok({
      blueprint: {
        id: blueprint.id,
        projectId: blueprint.projectId,
        title: blueprint.title,
        contentJson,
        renderedMarkdown,
        version: blueprint.version,
        metadataJson: blueprint.metadataJson,
        createdAt: blueprint.createdAt,
        updatedAt: blueprint.updatedAt,
      },
    });
  } catch (err) {
    logError('Blueprint generation', err, { projectId: params.projectId });

    // Check if it's an LLM-specific error
    if (err instanceof Error && err.message.includes('LLM')) {
      return error(
        500,
        ErrorCodes.BLUEPRINT_LLM_FAILED,
        'Failed to generate blueprint. The AI service encountered an error. Please try again.'
      );
    }

    return CommonErrors.internalError('Failed to generate blueprint. Please try again.');
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    const { projectId } = params;

    // Verify user has access to this project via workspace
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
              },
            },
          },
        },
        blueprints: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      return CommonErrors.notFound('Project', 'Project not found or access denied');
    }

    return ok({
      blueprints: project.blueprints,
    });
  } catch (err) {
    logError('Fetch blueprints', err, { projectId: params.projectId });
    return CommonErrors.databaseError('Failed to fetch blueprints');
  }
}
