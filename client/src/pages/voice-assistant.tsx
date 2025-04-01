// ✅ voice-assistant.tsx（フルバージョン）
// ✅ すべての説明・補足付きで構成された約280行のコンポーネントコードです

import { useState, useEffect, useRef } from "react";
import Fuse from 'fuse.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, X } from "lucide-react";

// 型定義（Fuse.js検索結果とチャットメッセージ）
type SearchResult = {
  content: string;
  type: 'text' | 'image';
  source: string;
};

type ChatMessage = {
  content: string;
  isUser: boolean;
  results?: SearchResult[];
};

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [searchData, setSearchData] = useState<any[]>([]);
  const [fuse, setFuse] = useState<Fuse<any>>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 🔽 ナレッジ検索用データ読み込み＆Fuse.js 初期化
  useEffect(() => {
    const checkSpeechSDK = () => {
      if ((window as any).SpeechSDK) {
        console.log("✅ Azure Speech SDK が読み込まれました");
      } else {
        console.error("❌ Speech SDK が未定義です - 再試行します");
        setTimeout(checkSpeechSDK, 1000); // 1秒後に再確認
      }
    };
    checkSpeechSDK();
    async function initializeSearch() {
      setIsLoading(true);
      setInitError(null);
      try {
        const response = await fetch('/api/tech-support/data/extracted_data.json');
        if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
        const data = await response.json();
        const processedData = Array.isArray(data) ? data : (data.slides || []);
        setSearchData(processedData);
        if (processedData.length === 0) throw new Error('データが空です');
        const fuseKeys = ['ノート', '本文', '画像テキスト'];
        const sample = processedData[0];
        for (const key in sample) {
          if (typeof sample[key] === 'string' && !fuseKeys.includes(key)) {
            fuseKeys.push(key);
          }
        }
        setFuse(new Fuse(processedData, {
          keys: fuseKeys,
          threshold: 0.5,
          includeMatches: true,
        }));
      } catch (err) {
        console.error('❌ データ読み込みエラー:', err);
        setInitError('データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
    initializeSearch();
  }, []);

  useEffect(() => {
    if (mode) startCamera();
    return () => stopCamera();
  }, [mode]);

  // 🔽 iOS対応の安定版音声認識処理（Azure）
  const startMic = async () => {
    if (isIOS()) {
      try {
        if (!(window as any).SpeechSDK) {
          throw new Error('Speech SDKが読み込まれていません');
        }
        const SpeechSDK = (window as any).SpeechSDK;
        const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
        const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
        if (!key || !region) throw new Error('キーまたはリージョンが未設定です');
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechRecognitionLanguage = "ja-JP";
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
        recognizer.recognized = (s: any, e: any) => {
          if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            setMessages(prev => [...prev, { content: e.result.text, isUser: true }]);
          }
        };
        recognizer.canceled = () => {
          recognizer.stopContinuousRecognitionAsync();
          setIsRecording(false);
        };
        recognizer.sessionStopped = () => {
          recognizer.stopContinuousRecognitionAsync();
          setIsRecording(false);
        };
        recognizer.startContinuousRecognitionAsync();
        setIsRecording(true);
      } catch (error: any) {
        console.error("Azure認識エラー:", error);
        setMessages(prev => [...prev, {
          content: `Azure音声認識の起動に失敗しました：${error.message}`,
          isUser: false
        }]);
        setIsRecording(false);
      }
    } else {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) throw new Error('Web Speech API 非対応');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'ja-JP';
        recognition.interimResults = true;
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          if (event.results[last].isFinal) {
            setMessages(prev => [...prev, { content: transcript, isUser: true }]);
          }
        };
        recognition.onerror = (event: any) => {
          console.error('音声認識エラー:', event.error);
          setIsRecording(false);
        };
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error("マイク起動失敗:", err);
        setMessages(prev => [...prev, {
          content: `音声認識の開始に失敗しました: ${err.message}`,
          isUser: false
        }]);
        setIsRecording(false);
      }
    }
  };

  const stopMic = () => {
    setIsRecording(false);
    console.log("🎤 マイクを停止しました");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      console.log("📷 カメラが起動しました");
    } catch (err) {
      console.error("カメラの起動に失敗しました", err);
    }
  };

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    console.log("📷 カメラを停止しました");
  };

  // 🔽 検索とChatGPT応答を同時に実行
  const handleSearchAndChat = async () => {
    const query = inputText.trim();
    if (!query) return;
    setInputText("");
    await handleSearch(query);
    await sendToChatGPT(query);
  };

  const handleSearch = async (query?: string) => {
    const rawText = typeof query === 'string' ? query : inputText;
    const searchText = rawText?.trim() ?? '';
    if (!searchText) return;
    try {
      if (!fuse || !searchData.length) throw new Error('検索エンジンの準備中です。');
      const results = fuse.search(searchText);
      const searchResults = results.map(result => ({
        content: result.item.ノート || (result.item.本文 ? result.item.本文.join('\n') : ''),
        type: result.item.画像テキスト && result.item.画像テキスト.length > 0 ? 'image' : 'text',
        source: result.item.画像テキスト?.[0]?.画像パス?.replace(/^.*\\output\\images\\/, '/api/tech-support/images/') || ''
      }));
      setMessages(prev => [...prev, { content: "検索結果:", isUser: false, results: searchResults }]);
    } catch (error) {
      console.error('検索エラー:', error);
      setMessages(prev => [...prev, { content: "検索中にエラーが発生しました。", isUser: false }]);
    }
  };

  // 🔽 ChatGPTに質問を送信（Fuse検索結果を含めるRAG型）
  const sendToChatGPT = async (userText: string) => {
    try {
      const results = fuse?.search(userText) ?? [];
      const contextText = results.slice(0, 3).map((r, i) => {
        const note = r.item.ノート ?? '';
        const body = Array.isArray(r.item.本文) ? r.item.本文.join('\n') : '';
        return `【スライド${i + 1}】\n${note}\n${body}`;
      }).join('\n\n');

      const prompt = `
以下は保守用車ナレッジから検索された情報です。
この情報の範囲内で、次の質問に対して正確に回答してください。

${contextText}

【質問】
${userText}

※該当情報がない場合は「情報が見つかりませんでした」と回答してください。
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { content: data.reply, isUser: false }]);
    } catch (error) {
      console.error('ChatGPT通信エラー:', error);
      setMessages(prev => [...prev, { content: 'ChatGPTからの応答に失敗しました。', isUser: false }]);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (selectedText) setInputText(selectedText);
  };

  return (
    <div className="container mx-auto p-4 relative">
      <h1 className="text-center text-xl font-bold mb-4">応急対応サポート</h1>
      <Button variant="outline" className="absolute top-2 right-2 rounded-full shadow px-3 py-1 text-sm" onClick={() => window.location.href = '/'}>
        終了
      </Button>

      <div className="flex flex-col h-[60vh] border border-blue-400 rounded-lg p-4 overflow-hidden mb-6">
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`rounded-lg p-3 max-w-[60%] ${message.isUser ? 'bg-blue-500 text-white cursor-pointer' : 'bg-gray-100'}`}
                  onMouseUp={handleTextSelection}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (message.isUser && confirm('このメッセージを削除しますか？')) {
                      setMessages(prev => prev.filter((_, i) => i !== index));
                    }
                  }}
                >
                  <p className="font-bold">{message.content}</p>
                  {!message.isUser && message.results && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {message.results.filter(r => r.type === 'image' && r.source).map((result, idx) => (
                        <div key={idx} className="border rounded cursor-pointer hover:shadow-lg" onClick={() => setSelectedResult(result)}>
                          <img src={result.source} alt={result.content} className="w-full h-32 object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Button variant={isRecording ? "destructive" : "default"} onClick={isRecording ? stopMic : startMic}>
            {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchAndChat()}
            placeholder={isLoading ? "データ読み込み中..." : "検索キーワードを入力..."}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSearchAndChat} disabled={isLoading || !fuse}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
