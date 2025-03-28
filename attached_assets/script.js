// グローバル変数
let recognition = null;
let isRepeatEnabled = false;
let lastSpokenText = '';

// スロットリング関数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// 音声認識のセットアップ
function setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('音声認識がサポートされていません');
        return null;
    }

    if (recognition) {
        recognition.stop();
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = true;
    const micButton = document.getElementById('micButton');

    recognition.onstart = () => {
        console.log('音声認識開始');
        micButton.classList.add('listening');
        addChatBubble('音声認識を開始しました...', 'system');
    };

    recognition.onend = () => {
        console.log('音声認識終了');
        micButton.classList.remove('listening');
    };

    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript;
            }
        }
    
        if (transcript && transcript !== lastSpokenText) {
            console.log('認識されたテキスト:', transcript);
            addChatBubble(transcript, 'user');
            const selectedTextInput = document.getElementById('selectedText');
            if (selectedTextInput) {
                selectedTextInput.value = transcript;
            }
            lastSpokenText = transcript;
        }
    };

    recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        addChatBubble('音声認識エラーが発生しました。', 'system');
    };

    return recognition;
}

// クリック時に元画像を表示する関数
function showFullImage(imagePath, imageId) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <img src="${imagePath}" alt="拡大画像">
            <p id="image-description">読み込み中...</p>
        </div>
    `;
    document.body.appendChild(modal);

    // 閉じるボタンのイベントリスナー
    modal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // APIから説明文を取得して表示
    fetch(`/image-description/${imageId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('説明文の取得に失敗しました');
            }
            return response.json();
        })
        .then(data => {
            const descriptionElement = document.getElementById('image-description');
            if (descriptionElement) {
                descriptionElement.textContent = data.description || '説明がありません。';
            }
        })
        .catch(error => {
            console.error('説明文取得エラー:', error);
            const descriptionElement = document.getElementById('image-description');
            if (descriptionElement) {
                descriptionElement.textContent = '説明文の取得中にエラーが発生しました。';
            }
        });
}


// チャットバブルを追加する関数
function addChatBubble(content, type) {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
        console.error('chatContainerが見つかりません');
        return;
    }

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type === 'answer' ? 'answer' : 'question'}`;

    if (type === 'answer' && content.imagePath) {
        const img = document.createElement('img');
        img.src = content.imagePath;
        img.alt = '検索結果画像';
        img.style.width = '100px'; // サムネイルサイズ
        img.style.cursor = 'pointer'; // クリック可能

        // クリックイベントで画像IDを渡す
        img.addEventListener('click', () => showFullImage(content.imagePath, content.item.スライド番号));
        bubble.appendChild(img);
    } else {
        bubble.textContent = content.text || content;
    }

    chatContainer.appendChild(bubble);
    scrollToBottom(chatContainer);
}

// スクロール処理
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

// 検索実行関数
function executeSearch(query) {
    console.log('検索クエリ:', query);

    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ search_query: query })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('サーバーからエラーレスポンスが返されました');
        }
        return response.json();
    })
    .then(data => {
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => addChatBubble(result, 'answer'));
        } else {
            addChatBubble('該当する回答が見つかりませんでした。', 'system');
        }
    })
    .catch(error => {
        console.error('エラーが発生しました:', error);
        addChatBubble('エラーが発生しました: ' + error.message, 'system');
    });
}

// DOMContentLoadedイベント
document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('micButton');
    const sendButton = document.getElementById('sendButton');
    const selectedText = document.getElementById('selectedText');
    const clearButton = document.getElementById('clearButton');

    // 音声認識ボタン
    if (micButton) {
        micButton.addEventListener('click', () => {
            const rec = setupSpeechRecognition();
            if (rec) rec.start();
        });
    }

    // 検索ボタン
    if (sendButton && selectedText) {
        sendButton.addEventListener('click', () => {
            const query = selectedText.value.trim();
            if (query) {
                // addChatBubble(query, 'question'); // 質問バブルを追加
                executeSearch(query); // 検索実行
            } else {
                addChatBubble('入力が空です。', 'system');
            }
        });
    }

    // バブルクリック時のテキスト選択
    document.getElementById('chatContainer').addEventListener('click', (event) => {
        if (event.target.classList.contains('chat-bubble')) {
            const text = event.target.textContent.trim();
            if (selectedText) {
                selectedText.value = text; // 選択したテキストを反映
                console.log('選択されたテキスト:', text);
            }
        }
    });

    // テキストクリアボタン
    if (clearButton && selectedText) {
        clearButton.addEventListener('click', () => {
            selectedText.value = ''; // テキストをクリア
            console.log('テキストクリアボタンがクリックされました');
        });
    }
    // カメラボタン
    const cameraButton = document.getElementById('cameraButton');
    const previewContainer = document.getElementById('previewContainer');

    if (cameraButton && previewContainer) {
        let currentStream = null; // カメラストリームを保持する変数

        cameraButton.addEventListener('click', async () => {
            try {
                // 既にカメラが起動している場合は停止
                if (currentStream) {
                    stopCamera(currentStream);
                    previewContainer.innerHTML = ''; // プレビュー領域をクリア
                    return;
                }

                // カメラにアクセス
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                currentStream = stream;

                // プレビューを表示
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                previewContainer.appendChild(video);
            } catch (error) {
                console.error('カメラエラー:', error);
                addChatBubble('カメラの利用に失敗しました。', 'system');
            }
        });
    }
});
// カメラを停止する関数
function stopCamera(stream) {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
}