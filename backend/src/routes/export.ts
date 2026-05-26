import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/mepa', async (req: AuthRequest, res: Response) => {
  const { productIds, all } = req.body as { productIds?: string[]; all?: boolean };

  const products = await prisma.product.findMany({
    where: all ? { attivo: true } : { id: { in: productIds } },
    orderBy: { categoria: 'asc' },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MepaFlow';
  wb.created = new Date();

  const ws = wb.addWorksheet('Catalogo MePA');

  // Headers style
  const headerRow = ws.addRow([
    'Codice Articolo', 'Descrizione', 'Descrizione Tecnica',
    'Categoria', 'Sotto-categoria', 'Prezzo Unitario (€)',
    'Unità di Misura', 'Aliquota IVA (%)', 'Codice CPV',
    'Marca', 'Modello', 'Disponibilità', 'Tempo Consegna (gg)', 'Stato',
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center' };
  });

  const cols = [15, 40, 60, 15, 15, 14, 12, 10, 14, 15, 15, 12, 12, 10];
  ws.columns = cols.map((width) => ({ width }));

  products.forEach((p) => {
    ws.addRow([
      p.codiceArticolo, p.descrizione, p.descrizioneTecnica || '',
      p.categoria, p.sottocategoria || '',
      p.prezzoUnitario, p.unitaMisura, p.iva,
      p.cpv || '', p.marca || '', p.modello || '',
      p.scorte ?? '', p.tempoConsegna ?? '',
      p.attivo ? 'ATTIVO' : 'INATTIVO',
    ]);
  });

  // Info sheet
  const info = wb.addWorksheet('Info');
  info.addRows([
    ['MepaFlow - Export Catalogo MePA'],
    ['Data export:', new Date().toLocaleDateString('it-IT')],
    ['Prodotti esportati:', products.length],
    ['Formato:', 'Template Consip MePA v2024'],
  ]);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="catalogo_mepa_${new Date().toISOString().split('T')[0]}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
