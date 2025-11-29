import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateBlueprintForProject } from '@/lib/blueprint-generator';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Generate blueprint using LLM
    const { blueprint, contentJson, renderedMarkdown } = await generateBlueprintForProject(projectId);

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    console.error('Error generating blueprint:', error);
    return NextResponse.json(
      { error: 'Failed to generate blueprint', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blueprints: project.blueprints,
    });
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blueprints' },
      { status: 500 }
    );
  }
}
