


function initLanguageUI(languageCode) {
    let language = languageCode || ''
    let dictionary = {
        "submit": {
            "id-ID": "kirim",
            "zh-CN": "提交",
            "zh-TW": "提交",
        },
        "home": {
            "id-ID": "awal",
            "zh-CN": "首页",
            "zh-TW": "首頁",
        },
    }


    console.log('Language UI started!')
    let elements = document.querySelectorAll("[data-i18n]");
    let replaceText = (el) => {
        let key = el.innerText.toLowerCase()
        if (!dictionary[key]) return
        el.innerText = dictionary[key][language] || key
    }
    if (language) elements.forEach(el => replaceText(el));

}

/* Speech to text */

let synth = window.speechSynthesis;
let voicesArray

const speeches = {
    init: function () {
        this.getAvailableVoices()
    },
    getAvailableVoices: function () {
        synth.addEventListener("voiceschanged", () => {
            voicesArray = synth
                .getVoices()
        })
    },
    speechUtteranceChunker: function (utt, settings, callback) {
        settings = settings || {};
        let self = this
        let newUtt;
        let txt = (settings && settings.offset !== undefined ? utt.text.substring(settings.offset) : utt.text);
        if (utt.voice && utt.voice.voiceURI === 'native') { // Not part of the spec
            newUtt = utt;
            newUtt.text = txt;
            newUtt.addEventListener('end', function () {
                if (self.speechUtteranceChunker.cancel) {
                    self.speechUtteranceChunker.cancel = false;
                }
                if (callback !== undefined) {
                    callback();
                }
            });
        }
        else {
            let chunkLength = (settings && settings.chunkLength) || 100;
            let pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
            let chunkArr = txt.match(pattRegex);
            
            if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
                //call once all text has been spoken...
                if (callback !== undefined) {
                    callback();
                }
                return;
            }
            let chunk = chunkArr[0];
            newUtt = new SpeechSynthesisUtterance(chunk);
            newUtt.voice = settings.voice
            newUtt.pitch = settings.pitch || 1
            newUtt.rate = settings.rate || 1.2
            newUtt.volume = settings.volume || 0.8
            let x;
            for (x in utt) {
                if (utt.hasOwnProperty(x) && x !== 'text') {
                    newUtt[x] = utt[x];
                }
            }
            newUtt.addEventListener('end', function () {
                if (self.speechUtteranceChunker.cancel) {
                    self.speechUtteranceChunker.cancel = false;
                    return;
                }
                settings.offset = settings.offset || 0;
                settings.offset += chunk.length - 1;
            
                self.speechUtteranceChunker(utt, settings, callback);
            });
        }

        if (settings.modifier) {
            settings.modifier(newUtt);
        }
        console.log(newUtt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
        //placing the speak invocation inside a callback fixes ordering and onend issues.
        setTimeout(function () {
            speechSynthesis.speak(newUtt);
        }, 0);
    },
    // Speak the utterance
    speakText: function (text, languageCode) {
        let lang

        switch (languageCode) {
            case "cmn-hans-cn":
                lang = "zh-TW"
                break;
            case "cmn-hant-tw":
                lang = "zh-TW"
                break;
            case "ja-jp":
                lang = "ja-JP"
                break;
            case "en-uk":
                lang = "en-UK"
                break;
            case "ko-kr":
                lang = "ko-KR"
                break;
            case "zh-CN":
                lang = "zh-CN"
                break;
            case "id-id":
                lang = "id-ID"
                break;
            default:
                lang = "en-US"
        }

        let utterance = new SpeechSynthesisUtterance(text);
        // Get the first `en` language voice in the list
        let selectedVoice = voicesArray
            .filter(function (voice) {
                return voice.lang === lang;
            })[0]

        console.log(languageCode)
        console.log(selectedVoice);

        synth.cancel();
        this.speechUtteranceChunker(utterance, {
            chunkLength: 75,
            voice: selectedVoice,
        }, function () {
            //some code to execute when done
            console.log('Done!');
        });
    },

}

//Start app
initLanguageUI()
speeches.init()