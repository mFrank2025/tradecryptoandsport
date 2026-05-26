import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const rdoSchema = z.object({
  numero: z.string().min(1),
  titolo: z.string().min(1),
  stazioneAppaltante: z.string().min(1),
  importoBase: z.number().positive(),
  scadenza: z.string().datetime(),
  stato: z.enum(['NUOVA', 'IN_LAVORAZIONE', 'OFFERTA_INVIATA', 'AGGIUDICATA', 'PERSA', 'SCADUTA']).default('NUOVA'),
  priorita: z.enum(['ALTA', 'MEDIA', 'BASSA']).default('MEDIA'),
  note: z.string().optional(),
  prodotti: z.array(z.string()).optional(),
});

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { stato, priorita, search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (stato) where.stato = stato;
  if (priorita) where.priorita = priorita;
  if (search) where.OR = [
    { titolo: { contains: search, mode: 'insensitive' } },
    { numero: { contains: search, mode: 'insensitive' } },
    { stazioneAppaltante: { contains: search, mode: 'insensitive' } },
  ];

  const [items, total] = await Promise.all([
    prisma.rdo.findMany({
      where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit),
      orderBy: { scadenza: 'asc' },
      include: { prodotti: { include: { product: true } } },
    }),
    prisma.rdo.count({ where }),
  ]);
  res.json({ items, total });
});

router.get('/kpi', async (req: AuthRequest, res: Response) => {
  const [prodottiAttivi, prodottiTotali, rdoActive, rdoAggiudicate, rdoScadenza] = await Promise.all([
    prisma.product.count({ where: { attivo: true } }),
    prisma.product.count(),
    prisma.rdo.findMany({ where: { stato: { in: ['NUOVA', 'IN_LAVORAZIONE', 'OFFERTA_INVIATA'] } }, select: { importoBase: true } }),
    prisma.rdo.count({ where: { stato: 'AGGIUDICATA' } }),
    prisma.rdo.count({ where: { stato: { in: ['NUOVA', 'IN_LAVORAZIONE', 'OFFERTA_INVIATA'] }, scadenza: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  const totalRdo = await prisma.rdo.count({ where: { stato: { in: ['AGGIUDICATA', 'PERSA', 'SCADUTA', 'OFFERTA_INVIATA'] } } });
  res.json({
    prodottiAttivi,
    prodottiTotali,
    rdoInScadenza: rdoScadenza,
    valoreOfferte: rdoActive.reduce((s, r) => s + r.importoBase, 0),
    rdoVinte: rdoAggiudicate,
    tassoAggiudicazione: totalRdo > 0 ? (rdoAggiudicate / totalRdo) * 100 : 0,
  });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = rdoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { prodotti, ...data } = parsed.data;
  const rdo = await prisma.rdo.create({
    data: {
      ...data,
      scadenza: new Date(data.scadenza),
      ...(prodotti?.length ? {
        prodotti: { create: prodotti.map((productId) => ({ productId })) },
      } : {}),
    },
    include: { prodotti: { include: { product: true } } },
  });
  res.status(201).json(rdo);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = rdoSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { prodotti, scadenza, ...data } = parsed.data;
  const rdo = await prisma.rdo.update({
    where: { id: req.params.id },
    data: { ...data, ...(scadenza ? { scadenza: new Date(scadenza) } : {}) },
    include: { prodotti: { include: { product: true } } },
  });
  res.json(rdo);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.rdo.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
