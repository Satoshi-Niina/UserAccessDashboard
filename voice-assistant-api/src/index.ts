import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/recognize', (req, res) => {
  // TODO: 音声認識の実装
  res.json({ text: '認識されたテキスト' });
});

app.post('/respond', (req, res) => {
  const { text } = req.body;
  // TODO: AIの応答を実装
  res.json({ response: '検索結果', image: 'https://example.com/test-image.jpg' });
});

app.listen(port, () => {
  console.log(`Voice Assistant API listening at http://localhost:${port}`);
});
