import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const project = await db.project.findUnique({
      where: {
        id: params.projectId,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      return CommonErrors.notFound('Project');
    }

    return ok({ project });
  } catch (error) {
    logError('Get project', error, { projectId: params.projectId });
    return CommonErrors.internalError('Failed to load project');
  }
}
