import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * GET /api/ai-use-cases/[aiUseCaseId]/policies
 * Fetch all policy mappings for this AI use case
 */
export async function GET(
  req: Request,
  { params }: { params: { aiUseCaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Fetch AI use case with workspace access check
    const aiUseCase = await db.aiUseCase.findFirst({
      where: {
        id: params.aiUseCaseId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    // Fetch mappings with policy details
    const mappings = await db.aiPolicyMapping.findMany({
      where: {
        aiUseCaseId: params.aiUseCaseId,
      },
      include: {
        aiPolicy: true,
      },
      orderBy: [
        { aiPolicy: { category: 'asc' } },
        { aiPolicy: { name: 'asc' } },
      ],
    });

    // Format response
    const formattedMappings = mappings.map((mapping) => ({
      id: mapping.id,
      status: mapping.status,
      notes: mapping.notes,
      lastUpdatedBy: mapping.lastUpdatedBy,
      lastUpdatedAt: mapping.lastUpdatedAt,
      policy: {
        id: mapping.aiPolicy.id,
        key: mapping.aiPolicy.key,
        name: mapping.aiPolicy.name,
        category: mapping.aiPolicy.category,
        description: mapping.aiPolicy.description,
        isActive: mapping.aiPolicy.isActive,
      },
    }));

    return ok({ mappings: formattedMappings });
  } catch (error) {
    logError('Get policy mappings', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to load policy mappings');
  }
}

const updateMappingsSchema = z.object({
  mappings: z.array(
    z.object({
      policyId: z.string(),
      status: z.enum(['not_assessed', 'not_applicable', 'in_progress', 'compliant', 'non_compliant']),
      notes: z.string().optional(),
    })
  ),
});

/**
 * PUT /api/ai-use-cases/[aiUseCaseId]/policies
 * Upsert policy mappings for this AI use case
 */
export async function PUT(
  req: Request,
  { params }: { params: { aiUseCaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return CommonErrors.unauthorized();
    }

    // Fetch AI use case with workspace access check
    const aiUseCase = await db.aiUseCase.findFirst({
      where: {
        id: params.aiUseCaseId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    const body = await req.json();
    const data = updateMappingsSchema.parse(body);

    // Verify all policies belong to same workspace
    for (const mapping of data.mappings) {
      const policy = await db.aiPolicy.findUnique({
        where: { id: mapping.policyId },
      });

      if (!policy) {
        return CommonErrors.invalidInput(`Policy ${mapping.policyId} not found`);
      }

      if (policy.workspaceId !== aiUseCase.workspaceId) {
        return CommonErrors.forbidden('Policy does not belong to this workspace');
      }
    }

    // Upsert each mapping
    const userEmail = session.user.email || session.user.name || 'Unknown';
    const now = new Date();

    for (const mapping of data.mappings) {
      await db.aiPolicyMapping.upsert({
        where: {
          aiUseCaseId_aiPolicyId: {
            aiUseCaseId: params.aiUseCaseId,
            aiPolicyId: mapping.policyId,
          },
        },
        update: {
          status: mapping.status,
          notes: mapping.notes || null,
          lastUpdatedBy: userEmail,
          lastUpdatedAt: now,
          updatedAt: now,
        },
        create: {
          aiUseCaseId: params.aiUseCaseId,
          aiPolicyId: mapping.policyId,
          status: mapping.status,
          notes: mapping.notes || null,
          lastUpdatedBy: userEmail,
          lastUpdatedAt: now,
        },
      });
    }

    // Fetch and return updated mappings
    const updatedMappings = await db.aiPolicyMapping.findMany({
      where: {
        aiUseCaseId: params.aiUseCaseId,
      },
      include: {
        aiPolicy: true,
      },
      orderBy: [
        { aiPolicy: { category: 'asc' } },
        { aiPolicy: { name: 'asc' } },
      ],
    });

    const formattedMappings = updatedMappings.map((mapping) => ({
      id: mapping.id,
      status: mapping.status,
      notes: mapping.notes,
      lastUpdatedBy: mapping.lastUpdatedBy,
      lastUpdatedAt: mapping.lastUpdatedAt,
      policy: {
        id: mapping.aiPolicy.id,
        key: mapping.aiPolicy.key,
        name: mapping.aiPolicy.name,
        category: mapping.aiPolicy.category,
        description: mapping.aiPolicy.description,
        isActive: mapping.aiPolicy.isActive,
      },
    }));

    return ok({ mappings: formattedMappings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Update policy mappings', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to update policy mappings');
  }
}
