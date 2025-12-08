import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

export async function GET(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return CommonErrors.unauthorized();
    }

    const { blueprintId } = params;

    // Fetch blueprint with workspace to verify access
    const blueprint = await db.blueprint.findUnique({
      where: { id: blueprintId },
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

    if (!blueprint || blueprint.workspace.members.length === 0) {
      return CommonErrors.notFound('Blueprint', 'Blueprint not found or access denied');
    }

    return ok({
      blueprint: {
        id: blueprint.id,
        workspaceId: blueprint.workspaceId,
        title: blueprint.title,
        contentJson: blueprint.contentJson,
        renderedMarkdown: blueprint.renderedMarkdown,
        version: blueprint.version,
        metadataJson: blueprint.metadataJson,
        createdAt: blueprint.createdAt,
        updatedAt: blueprint.updatedAt,
      },
    });
  } catch (error) {
    logError('Fetch blueprint', error, { blueprintId: params.blueprintId });
    return CommonErrors.internalError('Failed to fetch blueprint');
  }
}
