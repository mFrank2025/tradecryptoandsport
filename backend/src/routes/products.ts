import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

const productSchema = z.object({
  codiceArticolo: z.string().min(1),
  descrizione: z.string().min(1),
  descrizioneTecnica: z.string().optional(),
  categoria: z.string().min(1),
  sottocategoria: z.string().optional(),
  prezzoUnitario: z.number().positive(),
  unitaMisura: z.string().min(1),
  iva: z.number().int().default(22),
  cpv: z.string().optional(),
  marca: z.string().optional(),
  modello: z.string().optional(),
  attivo: z.boolean().default(true),
  scorte: z.number().int().optional(),
  tempoConsegna: z.number().int().optional(),
});

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, categoria, attivo, page = '1', limit = '50' } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { descrizione: { contains: search, mode: 'insensitive' } },
    { codiceArticolo: { contains: search, mode: 'insensitive' } },
  ];
  if (categoria) where.categoria = categoria;
  if (attivo !== undefined) where.attivo = attivo === 'true';

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: 'Prodotto non trovato' });
  res.json(product);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const product = await prisma.product.create({ data: parsed.data });
  res.status(201).json(product);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const product = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(product);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post('/import/csv', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File CSV mancante' });
  const mapping: Record<string, string> = JSON.parse(req.body.mapping || '{}');
  const content = fs.readFileSync(req.file.path, 'utf-8');
  const { data } = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });

  const products = data.map((row) => {
    const p: Record<string, unknown> = {};
    Object.entries(mapping).forEach(([field, col]) => { if (col && col !== '__skip__') p[field] = row[col]; });
    if (p.prezzoUnitario) p.prezzoUnitario = parseFloat(String(p.prezzoUnitario).replace(',', '.'));
    if (p.iva) p.iva = parseInt(String(p.iva));
    if (p.scorte) p.scorte = parseInt(String(p.scorte));
    if (p.tempoConsegna) p.tempoConsegna = parseInt(String(p.tempoConsegna));
    return p;
  });

  let created = 0;
  for (const p of products) {
    const parsed = productSchema.safeParse({ attivo: true, iva: 22, unitaMisura: 'pz', ...p });
    if (parsed.success) {
      await prisma.product.upsert({ where: { codiceArticolo: parsed.data.codiceArticolo }, update: parsed.data, create: parsed.data });
      created++;
    }
  }
  fs.unlinkSync(req.file.path);
  res.json({ imported: created, total: data.length });
});

export default router;
