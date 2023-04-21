// 音声認識オブジェクトを作成
var recognition = new webkitSpeechRecognition();

// 音声認識の言語を設定
recognition.lang = "ja-JP";

// 音声認識の結果を連続的に取得するかどうかを設定
recognition.continuous = true;

// 音声認識の中間結果を取得するかどうかを設定
recognition.interimResults = true;

// 音声認識の結果を表示する要素を取得
var result = document.getElementById("result");

// 音声認識の結果を表示する要素を取得
var res = document.getElementById("res");

// 音声認識が開始されたときに呼ばれる関数を設定
recognition.onstart = function() {
  console.log("音声認識が開始されました");
};

// 音声認識が停止されたときに呼ばれる関数を設定
recognition.onend = function() {
  console.log("音声認識が停止されました");
};

// 音声認識の結果が得られたときに呼ばれる関数を設定
recognition.onresult = function(event) {
  // 結果の配列を取得
  var results = event.results;

  // 結果の文字列を初期化
  var text = "";

  // 結果の配列をループして文字列に追加
  for (var i = event.resultIndex; i < results.length; i++) {
    // 確定した結果かどうかを判定
    if (results[i].isFinal) {
      // 確定した結果ならば、太字で表示
      text += "<b>" + results[i][0].transcript + "</b>";
    } else {
      // 確定していない結果ならば、通常で表示
      text += results[i][0].transcript;
    }
  }

  // 結果の文字列を表示する要素に代入
  result.innerHTML = text;
};

// 音声認識の開始ボタンを取得
var startButton = document.getElementById("start");

// 音声認識の開始ボタンがクリックされたときに呼ばれる関数を設定
startButton.onclick = function() {
  // 音声認識を開始する
  recognition.start();
};

// 音声認識の停止ボタンを取得
var stopButton = document.getElementById("stop");

// 音声認識の停止ボタンがクリックされたときに呼ばれる関数を設定
stopButton.onclick = function() {
  // 音声認識を停止する
  recognition.stop();
};

// 音声認識の停止ボタンを取得
var chatButton = document.getElementById("send");

// 音声認識の停止ボタンがクリックされたときに呼ばれる関数を設定
chatButton.onclick = async function (event) {
    event.preventDefault();
    let messageHistory = [];
    let setting = {"role": "system", "content": "あなたは人間の友達です。できるだけ句点を多く含めて返答を返してください。"}
    messageHistory.push(setting);
    async function appendAssistantResponse(assistantMessage) {
        messageHistory.push({ 'role': 'assistant', 'content': assistantMessage });
    }

    const userMessage = result.innerHTML;
    //$('#chat-history').append('<p class="you">' + userMessage + '</p>');
    res.innerHTML = ''
    messageHistory.push({ 'role': 'user', 'content': userMessage });

    const formData = $(this).serialize();
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({
        'model': 'gpt-3.5-turbo',
        'stream': true,
        'messages': messageHistory,
        'max_tokens': 1024,

        }),
    });

    if (!response.ok) {
        console.error('Error:', await response.text());
        return;
    }

    //$("#chat-input").val("");
    //$("#chat-input").focus();

    const reader = response.body.getReader();
    const textDecoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();

        if (done) {
            break;
        }

        buffer += textDecoder.decode(value, { stream: true });

        while (true) {
            const newlineIndex = buffer.indexOf('\n');
            if (newlineIndex === -1) {
            break;
            }

            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('data:')) {

                if (line.includes('[DONE]')) {
                    //$('#chat-history').append('<hr>');
                    res.innerHTML += '<hr>';
                    return;
                }

                const jsonData = JSON.parse(line.slice(5));

                if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                    const assistantMessage = jsonData.choices[0].delta.content;
                    //$('#chat-history').append('' + assistantMessage + '');
                    await appendAssistantResponse(assistantMessage);
                    res.innerHTML += assistantMessage;
                }
            }
        }
    }
  
};
