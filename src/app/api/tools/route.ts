import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/tools
 *
 * Returns all tools in the database.
 * Optional - mainly for debugging/internal use.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tools = await db.tool.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tools });
  } catch (error: any) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools', details: error.message },
      { status: 500 }
    );
  }
}
