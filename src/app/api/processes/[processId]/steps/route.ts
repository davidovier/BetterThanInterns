import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

const createStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

async function verifyProcessAccess(processId: string, userId: string) {
  const process = await db.process.findUnique({
    where: { id: processId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  return process && process.workspace.members.length > 0;
}

export async function POST(
  req: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    const hasAccess = await verifyProcessAccess(
      params.processId,
      session.user.id
    );
    if (!hasAccess) {
      return CommonErrors.forbidden('You do not have access to this process');
    }

    const body = await req.json();
    const data = createStepSchema.parse(body);

    const step = await db.processStep.create({
      data: {
        processId: params.processId,
        title: data.title,
        description: data.description,
        owner: data.owner,
        inputs: data.inputs || [],
        outputs: data.outputs || [],
        frequency: data.frequency,
        duration: data.duration,
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
      },
    });

    return ok({ step });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Create step', error, { processId: params.processId });
    return CommonErrors.internalError('Failed to create step');
  }
}
