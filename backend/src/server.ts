import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/medicamentos', (_req, res) => {
  res.status(200).json([
    { id: 1, nome: 'Losartana', dosagem: '50mg', horario: '08:00' },
    { id: 2, nome: 'Metformina', dosagem: '850mg', horario: '12:00' }
  ]);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;