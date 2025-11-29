import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blueprintId } = params;

    // Fetch blueprint with project and workspace to verify access
    const blueprint = await db.blueprint.findUnique({
      where: { id: blueprintId },
      include: {
        project: {
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
        },
      },
    });

    if (!blueprint || blueprint.project.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blueprint: {
        id: blueprint.id,
        projectId: blueprint.projectId,
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
    console.error('Error fetching blueprint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blueprint' },
      { status: 500 }
    );
  }
}
