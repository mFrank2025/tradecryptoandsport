import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import rdoRouter from './routes/rdo.js';
import aiRouter from './routes/ai.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'mepaflow-backend' }));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/rdo', rdoRouter);
app.use('/api/ai', aiRouter);
app.use('/api/export', exportRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`MepaFlow backend running on port ${PORT}`);
});

export default app;
