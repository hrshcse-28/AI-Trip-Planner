import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ── PUT /api/users/me ───────────────────────────────────────────────────

router.put('/me', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true, createdAt: true },
    });

    return res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
