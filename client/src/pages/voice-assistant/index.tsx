import React, { useState } from 'react';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { Mic, Send, X } from "lucide-react";
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';

export default function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 音声認識の結果をメッセージとして表示する
  const handleVoiceResult = (transcript) => {
    setMessages(prev => [...prev, { 
      content: transcript, 
      isUser: true,
      isVoiceResult: true 
    }]);
    setIsRecording(false);
  };

  // メッセージをクリックしたときのハンドラ
  const handleMessageClick = (message) => {
    if (message.isUser) {
      setInputText(message.content);
    }
  };

  // 検索実行
  const handleSearch = async () => {
    if (!inputText.trim()) return;

    try {
      const response = await fetch('/api/tech-support/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputText })
      });

      if (!response.ok) throw new Error('検索に失敗しました');
      const searchResults = await response.json();

      setMessages(prev => [...prev, 
        { content: inputText, isUser: true },
        { 
          content: "検索結果:", 
          isUser: false,
          results: searchResults
        }
      ]);
      setInputText("");
    } catch (error) {
      console.error('検索エラー:', error);
      setMessages(prev => [...prev, {
        content: "エラーが発生しました。しばらく待ってから再度お試しください。",
        isUser: false
      }]);
    }
  };

  // 音声認識の開始・停止
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('お使いのブラウザは音声認識をサポートしていません。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true; // 継続的な認識を有効化
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setMessages(prev => [...prev, {
        content: "音声認識を開始しました...",
        isUser: false
      }]);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;

      if (event.results[last].isFinal) {
        setMessages(prevMessages => [...prevMessages, { content: transcript, isUser: true }]);
        setInputText(transcript); // 認識したテキストを入力欄に設定
      }
    };

    recognition.start();
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer ${
                message.isUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
              } ${message.isVoiceResult ? 'border-2 border-blue-300' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              {message.content}
              {message.results && <SearchPreview results={message.results} />}
            </div>
          ))}
        </div>

        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleRecording}
              className="flex-none"
            >
              {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="キーワードを入力..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} className="flex-none">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}