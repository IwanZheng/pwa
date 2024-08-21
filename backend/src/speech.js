import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Imports the Google Cloud client library
const { Storage } = require('@google-cloud/storage');
// Imports the Google Cloud client library
const Speech = require('@google-cloud/speech').v1p1beta1;
// Imports the Google Cloud client library
const TextToSpeech = require('@google-cloud/text-to-speech');
// Imports the Translation library
const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const { VertexAI } = require('@google-cloud/vertexai');

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createNonStreamingMultipartContent(
    projectId = 'pwa-llamaindex',
    location = 'us-central1',
    model = 'gemini-1.5-flash-001',
    image = 'gs://generativeai-downloads/images/scones.jpg',
    mimeType = 'image/jpeg'
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({ project: projectId, location: location });

    // Instantiate the model
    const generativeVisionModel = vertexAI.getGenerativeModel({
        model: model,
    });

    // For images, the SDK supports both Google Cloud Storage URI and base64 strings
    const filePart = {
        fileData: {
            fileUri: image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: 'what is shown in this image?',
    };

    const request = {
        contents: [{ role: 'user', parts: [filePart, textPart] }],
    };

    console.log('Prompt Text:');
    console.log(request.contents[0].parts[1].text);

    console.log('Non-Streaming Response Text:');

    // Generate a response
    const response = await generativeVisionModel.generateContent(request);

    // Select the text from the response
    const fullTextResponse =
        response.response.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);
    return fullTextResponse
}
// Instantiates a client
const translationClient = new TranslationServiceClient();

export const detectChatLanguage = async (text) => {
    const projectId = 'pwa-llamaindex';
    const location = 'global';
    // Construct request
    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        content: text,
    };
    let languageArray = {
        "en": "en-US",
        "id": "id-ID",
        "ko": "ko-KR",
        "ja": "ja-JP",
        "zh-TW": "zh-TW",
        "zh-CN": "zh-CN",
    }
    // Run request
    const result = await translationClient.detectLanguage(request);
    let languageDetected = result[0].languages[0].languageCode
    let language = languageArray[languageDetected]

    return language
}

export const speechSynth = async (queryObj) => {
    try {
        // Import other required libraries
        const client = new TextToSpeech.TextToSpeechClient();
        const storage = new Storage();
        // The ID of your GCS bucket
        const bucketName = 'gs://pwa-llamaindex.appspot.com';
        // The path of your GCS file
        const filePath = 'users/' + queryObj.recipient + "/audio/" + `output.mp3 `
        // https://stackoverflow.com/questions/54241849/save-an-audiofile-from-google-text-to-speech-to-firebase-storage-using-google-cl
        const bucket = storage.bucket(bucketName);
        let file = bucket.file(filePath);

        // Construct the request
        //remove all html tags asterisks and backticks
        let myText = queryObj.content.replace(/<[^>]+>|\*|`/g, '');

        let language = queryObj.language || await detectChatLanguage(myText)

        const request = {
            input: { text: myText },
            // Select the language and SSML voice gender (optional)
            voice: { languageCode: language, ssmlGender: 'NEUTRAL' },
            // select the type of audio encoding
            audioConfig: { audioEncoding: 'MP3' },
        };
        // Performs the text-to-speech request
        const [response] = await client.synthesizeSpeech(request);
        const options = { // construct the file to write
            metadata: {
                contentType: 'audio/mpeg',
                metadata: {
                    source: 'Google Text-to-Speech'
                }
            }
        };
        const save = await file.save(response.audioContent, options)

        return filePath
    }
    catch (e) {
        console.error(e);
    }
}

// Creates a google speech client
export const speechRecognition = async (queryObj) => {
    const client = new Speech.SpeechClient();
    // The ID of your GCS bucket
    const bucketName = 'gs://pwa-llamaindex.appspot.com';
    // The ID of your GCS file
    const fileName = '/users/' + queryObj.sender + "/audio/" + queryObj.content;
    const gcsUri = bucketName + fileName
    const config = {
        languageCode: queryObj.language || 'id-ID',
        alternativeLanguageCodes: ['ko-KR', 'zh-TW', 'zh-CN', 'ja-JP', 'id-ID', "en-US",],
        model: "default",
    };
    const audio = {
        uri: gcsUri,
    };
    const request = {
        config: config,
        audio: audio,
    };

    try {
        const [response] = await client.recognize(request);

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        // End a google speech client
        if (!response.results[0]) return

        let language = response.results[0].languageCode || config.languageCode

        let translatedObj = {
            "text": transcription,
            "languageCode": language
        }

        return translatedObj;
    }
    catch (e) {
        console.error(e);
    }
}