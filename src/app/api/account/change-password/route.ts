import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors, ErrorCodes, error } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { z } from 'zod';
import { compare, hash } from 'bcrypt';

/**
 * POST /api/account/change-password
 *
 * Change user's password
 * Requires current password for security
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z
        .string()
        .min(10, 'Password must be at least 10 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return CommonErrors.invalidInput(
        validation.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      return CommonErrors.invalidInput('New password and confirmation do not match');
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return CommonErrors.notFound('User');
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return error(
        401,
        ErrorCodes.UNAUTHORIZED,
        'Current password is incorrect'
      );
    }

    // Check if new password is different from old
    const isSameAsOld = await compare(newPassword, user.password);
    if (isSameAsOld) {
      return CommonErrors.invalidInput(
        'New password must be different from current password'
      );
    }

    // Hash and save new password
    const hashedPassword = await hash(newPassword, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return ok({
      message: 'Password changed successfully',
    });
  } catch (err) {
    logError('Failed to change password', err);
    return CommonErrors.internalError();
  }
}
