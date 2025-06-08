import express, { Application } from 'express';
import path from 'path';
import { createAndInitializeChess } from '../chess';
import { ChessEngineInterface } from '../../kernel/chess-engine';

let engine: ChessEngineInterface;

export async function createServer(): Promise<Application> {
  const chess: any = await createAndInitializeChess();
  engine = chess.engine as ChessEngineInterface;

  const app = express();
  app.use(express.json());

  app.use(express.static(path.resolve(__dirname, '../public')));

  app.post('/api/new-game', async (_req, res) => {
    await chess.reset();
    res.json({ board: engine.getState().custom?.board });
  });

  app.post('/api/player-move', async (req, res) => {
    const { from, to } = req.body;
    if (!from || !to) {
      res.status(400).json({ error: 'from and to required' });
      return;
    }
    await engine.applyMove({ from, to });
    const engineMove = await engine.computeMove();
    if (engineMove) {
      await engine.applyMove(engineMove);
    }
    res.json({ engineMove, board: engine.getState().custom?.board });
  });

  app.get('/api/board', (_req, res) => {
    res.json({ board: engine.getState().custom?.board });
  });

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  createServer().then(app => {
    app.listen(PORT, () => {
      console.log(`Chess web server running on http://localhost:${PORT}`);
    });
  });
}
