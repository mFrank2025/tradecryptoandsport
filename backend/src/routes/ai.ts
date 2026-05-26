import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/generate-description', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    productId: z.string(),
    tone: z.enum(['tecnico', 'commerciale', 'breve']).default('tecnico'),
    additionalInstructions: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dati non validi' });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return res.status(404).json({ error: 'Prodotto non trovato' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'API Key Anthropic non configurata' });

  const toneInstructions: Record<string, string> = {
    tecnico: 'Scrivi in modo tecnico e formale, adatto alla Pubblica Amministrazione italiana. Includi specifiche dettagliate, normative di riferimento e conformità.',
    commerciale: 'Scrivi in modo persuasivo evidenziando i benefici e il valore. Tono professionale ma coinvolgente.',
    breve: 'Scrivi una descrizione concisa ed essenziale, massimo 3-4 righe con le informazioni chiave.',
  };

  const prompt = `Sei un esperto di cataloghi MePA (Mercato Elettronico della Pubblica Amministrazione italiana).

Genera una descrizione tecnica ottimizzata per il seguente prodotto da inserire nel catalogo MePA:

Prodotto: ${product.descrizione}
Codice: ${product.codiceArticolo}
Categoria: ${product.categoria}
Prezzo: €${product.prezzoUnitario} / ${product.unitaMisura}
IVA: ${product.iva}%
${product.marca ? `Marca: ${product.marca}` : ''}
${product.modello ? `Modello: ${product.modello}` : ''}
${product.cpv ? `Codice CPV: ${product.cpv}` : ''}
${product.descrizioneTecnica ? `Specifiche attuali: ${product.descrizioneTecnica}` : ''}

Istruzioni stile: ${toneInstructions[parsed.data.tone]}
${parsed.data.additionalInstructions ? `Istruzioni aggiuntive: ${parsed.data.additionalInstructions}` : ''}

Genera SOLO la descrizione del prodotto, senza introduzioni o spiegazioni aggiuntive.`;

  const client = new Anthropic({ apiKey });

  // Stream the response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.messages.stream({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
