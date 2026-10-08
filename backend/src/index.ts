import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import userRoutes from './routes/users';
import destinationRoutes from './routes/destinations';

const app = express();
const port = process.env.PORT || 3000;

const allowedFrontend = process.env.FRONTEND_URL;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin === allowedFrontend) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ──────────────────────────────────────────────────────────────

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/destinations', destinationRoutes);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
