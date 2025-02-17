import axios from 'axios';

export const handleStartRecording = async (setIsRecording: (isRecording: boolean) => void, setInputText: (text: string) => void) => {
  setIsRecording(true);
  // TODO: 音声認識の実装
  try {
    const response = await axios.post('http://localhost:3000/recognize', { /* 音声データ */ });
    setInputText(response.data.text);
  } catch (error) {
    console.error('音声認識エラー:', error);
  }
};

export const handleStopRecording = (setIsRecording: (isRecording: boolean) => void) => {
  setIsRecording(false);
  // TODO: 音声認識の停止処理
};

export const handleSend = async (inputText: string, setMessages: (messages: any) => void, setInputText: (text: string) => void) => {
  if (!inputText.trim()) return;

  try {
    const response = await axios.post('http://localhost:3000/respond', { text: inputText });
    setMessages((prev: any) => [...prev, {
      content: response.data.response,
      isUser: false,
      image: response.data.image
    }]);
  } catch (error) {
    console.error('AI応答エラー:', error);
  }

  setInputText("");
};

export const handleClear = (setInputText: (text: string) => void) => {
  setInputText("");
};

export const handleExit = (setLocation: (location: string) => void) => {
  if (window.confirm('音声アシスタントを終了しますか？')) {
    setLocation("/");
  }
};
