import "dotenv/config";
import express from "express";
import cors from "cors";
import {
    Gemini,
    Document,
    VectorStoreIndex,
    SimpleDirectoryReader,
    GEMINI_MODEL,
} from "llamaindex";
import { initSettings } from "./src/settings.js";
import { speechRecognition, speechSynth, detectChatLanguage } from "./src/speech.js";

const app = express();
const port = process.env.PORT || 3000;
const keys = process.env.GOOGLE_API_KEY;
const env = process.env["NODE_ENV"];
const isDevelopment = !env || env === "development";

if (!keys) throw new Error("Please set the GOOGLE_API_KEY environment variable.");

if (isDevelopment) {
    console.warn("Running in development mode - allowing CORS for all origins");
    app.use(cors());
} else if (prodCorsOrigin) {
    console.log(
        `Running in production mode - allowing CORS for domain: ${prodCorsOrigin}`,
    );
    const corsOptions = {
        origin: prodCorsOrigin, // Restrict to production domain
    };
    app.use(cors(corsOptions));
} else {
    console.warn(
        "Production CORS origin not set, defaulting to no CORS."
    );
}

async function initializeIndex() {
    const documents = await new SimpleDirectoryReader().loadData({
        directoryPath: "./data",
    });
    return await VectorStoreIndex.fromDocuments(documents);
}
// for LlamaIndex LLM Settinggs
initSettings()
/* Gemini chat */
const gemini = new Gemini({
    model: GEMINI_MODEL.GEMINI_1_5_FLASH,
});

app.use(cors());
// Middleware to use JSON body parsing
app.use(express.json());

app.get("/", (req, res) => {
    res.send("LlamaIndex Express Server");
});

app.post("/tts", async (req, res) => {
    const response = await speechSynth(req.body);
    res.send({ message: { content: response.toString() } });
});

app.post("/generate", async (req, res) => {
    let query = req.body;
    if (!query) return res.status(400).send({ error: "Query not provided" });
    switch (req.body.type) {
        case "image/jpeg":
            console.log('Image detected')
            break;
        case "video/mp4":
            console.log('Video detected')
            break;
    }
})

app.post("/chat", async (req, res) => {
    let query = req.body;
    if (!query) return res.status(400).send({ error: "Query not provided" });
    let language = req.body.language || await detectChatLanguage(query.content)
    let question
    switch (req.body.type) {
        case "audio/wav":
            let questionObj = await speechRecognition(query)
            if (!questionObj) return
            question = questionObj.text
            language = questionObj.languageCode 
            break;
        case "image/jpeg":
            console.log('Image detected')
            break;
        case "video/mp4":
            console.log('Video detected')
            break;
        default:
            question = query.content
    }

    try {
        let chatModel = {
            messages: [
                {
                    content: "You want to talk like an assistant.",
                    role: "system"
                },
                {
                    content: question,
                    role: "user"
                },
            ],
        }

        if (req.body.history) {
            let history = req.body.history
            history.forEach((item) => {
                chatModel.messages.push({ content: item, role: "assistant" })
            })
        }

        const response = await gemini.chat(chatModel);
        response.message.sender = req.body.recipient;
        response.message.recipient = req.body.sender;
        response.message.language = language
 
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while processing the query." });
    }
});

app.post("/query", async (req, res) => {
    try {
        const index = await initializeIndex();
        const queryEngine = index.asQueryEngine();
        const response = await queryEngine.query({ query });
        const query = req.body.query; // Expecting a query in the JSON body
        if (!query) return res.status(400).send({ error: "Query not provided" });

        res.send({ message: { content: response.toString() } });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while processing the query." });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});