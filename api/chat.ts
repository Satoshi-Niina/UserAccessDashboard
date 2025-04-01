// /api/chat.ts
import express from 'express';
import fs from 'fs/promises';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
});

router.post('/', async (req, res) => {
  const { message } = req.body;

  try {
    // 🔽 ナレッジファイル読み込み（RAG用）
    const knowledgeText = await fs.readFile('./attached_assets/data/保守用車ナレッジ.txt', 'utf-8');

    // 🔽 ChatGPTに渡すプロンプトを生成
    const prompt = `
あなたは保守用車両の技術サポートAIです。
以下のナレッジ情報だけを使って、質問に回答してください。

【ナレッジ】
${knowledgeText}

【質問】
${message}

※ナレッジに見つからない場合は「情報が見つかりませんでした」と答えてください。
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('ChatGPT API エラー:', err);
    res.status(500).json({ reply: 'ChatGPT APIへの問い合わせに失敗しました。' });
  }
});

export default router;
