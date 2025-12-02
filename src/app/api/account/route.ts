import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { z } from 'zod';
import { compare } from 'bcrypt';
import { randomUUID } from 'crypto';

/**
 * DELETE /api/account
 *
 * Soft-delete user account
 * Requires current password for security
 * Anonymizes email and clears PII
 * Removes user from all workspaces
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required for account deletion'),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return CommonErrors.invalidInput(
        validation.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { currentPassword } = validation.data;

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id, deletedAt: null },
      include: {
        workspaces: true,
      },
    });

    if (!user) {
      return CommonErrors.notFound('User');
    }

    // Verify password before deletion
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return error(
        401,
        ErrorCodes.UNAUTHORIZED,
        'Current password is incorrect'
      );
    }

    // Perform soft deletion in a transaction
    await db.$transaction(async (tx) => {
      // Remove user from all workspaces
      await tx.workspaceMember.deleteMany({
        where: { userId: user.id },
      });

      // Soft delete user and anonymize data
      await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          email: `deleted-user-${randomUUID()}@example.com`,
          name: null,
          // Keep password hash for referential integrity but account is unusable
        },
      });
    });

    return ok({
      message: 'Account deleted successfully',
    });
  } catch (err) {
    logError('Failed to delete account', err);
    return CommonErrors.internalError();
  }
}
