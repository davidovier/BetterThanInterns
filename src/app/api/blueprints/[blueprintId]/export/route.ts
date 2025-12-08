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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'markdown';

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
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    if (format === 'markdown') {
      // Generate filename from blueprint title
      const filename = `${blueprint.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

      return new NextResponse(blueprint.renderedMarkdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Future: Support PDF export
    if (format === 'pdf') {
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Unsupported export format. Use format=markdown' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting blueprint:', error);
    return NextResponse.json(
      { error: 'Failed to export blueprint' },
      { status: 500 }
    );
  }
}
