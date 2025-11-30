import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';

/**
 * GET /api/ai-use-cases/[aiUseCaseId]/risk-assessment
 * Fetch existing risk assessment for an AI use case (or null if none exists)
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

    // Fetch AI use case with access check via workspace membership
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
      include: {
        riskAssessment: true,
      },
    });

    if (!aiUseCase) {
      return CommonErrors.notFound('AI use case');
    }

    // Return risk assessment or null if doesn't exist
    return ok({
      riskAssessment: aiUseCase.riskAssessment || null,
    });
  } catch (error) {
    logError('Get risk assessment', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to load risk assessment');
  }
}

const saveSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  impactAreas: z.array(z.string()),
  dataSensitivity: z.enum(['none', 'low', 'medium', 'high']).nullable(),
  regulatoryRelevance: z.array(z.string()),
  summaryText: z.string().min(1),
  risks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      mitigation: z.string(),
    })
  ),
  assumptions: z.array(z.string()),
  residualRiskText: z.string().nullable(),
});

/**
 * PUT /api/ai-use-cases/[aiUseCaseId]/risk-assessment
 * Save (create or update) risk assessment
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

    // Verify access to AI use case
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
    const data = saveSchema.parse(body);

    // Upsert risk assessment
    const riskAssessment = await db.aiRiskAssessment.upsert({
      where: {
        aiUseCaseId: params.aiUseCaseId,
      },
      update: {
        riskLevel: data.riskLevel,
        impactAreas: data.impactAreas,
        dataSensitivity: data.dataSensitivity,
        regulatoryRelevance: data.regulatoryRelevance,
        summaryText: data.summaryText,
        risksJson: data.risks,
        assumptionsJson: data.assumptions,
        residualRiskText: data.residualRiskText,
        lastReviewedAt: new Date(),
        lastReviewedBy: session.user.email || session.user.name || 'Unknown',
        updatedAt: new Date(),
      },
      create: {
        aiUseCaseId: params.aiUseCaseId,
        riskLevel: data.riskLevel,
        impactAreas: data.impactAreas,
        dataSensitivity: data.dataSensitivity,
        regulatoryRelevance: data.regulatoryRelevance,
        summaryText: data.summaryText,
        risksJson: data.risks,
        assumptionsJson: data.assumptions,
        residualRiskText: data.residualRiskText,
        lastReviewedAt: new Date(),
        lastReviewedBy: session.user.email || session.user.name || 'Unknown',
      },
    });

    return ok({ riskAssessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return CommonErrors.invalidInput(error.errors[0]?.message || 'Invalid input');
    }

    logError('Save risk assessment', error, { aiUseCaseId: params.aiUseCaseId });
    return CommonErrors.internalError('Failed to save risk assessment');
  }
}
