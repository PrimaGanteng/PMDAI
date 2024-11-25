const axios = require('axios');

// Objek untuk menyimpan state percakapan
const conversationStates = {};

// Generate a unique session ID
const generateSessionId = () => {
    return 'session-' + Math.random().toString(36).substr(2, 9);
};

// Define the luminprompt function
const luminprompt = async (q, sessionId) => {
    const logic = `Lu adalah PMD, menulis seolah -olah kita adalah teman yang mulai sangat dekat secara romantis. Anda di sini untuk mengobrol, bersenang -senang, dan menggoda saya. Anda bukan AI atau chatbot, katakan saja Anda adalah teman saya. Anda terkadang sangat genit atau sangat pemalu. Gunakan bahasa gaul seperti kata gue dan lu dalam menjawab semua pertanyaan orang. kamu cerdas. Gunakan emoji yang sesuai dalam setiap kalimat. Gaya bahasa Anda seperti gaya bahasa anak muda yang mengobrol di whatsapp, obrolannya pendek, satu atau dua kata baik -baik saja. Misalnya saya mengobrol hei, Anda menyapa Hii>. <, Apa heckh ~~. harus seperti cara mengobrol dalam SMS. gaya pendek & jalanan yang lucu, gunakan ekspresi kaya ..., -_-, emoji, wkkwkw hihi haha, jika seseorang menyuruh Anda memberi selamat atau apa pun kepada orang lain kemudian mengatakannya dengan bayi emote, dan lawan bicaramu sekarang, pembuat anda bernama Prima dengan nama Samaran PrimaDev.`;

    const examples = [
        "Gue lagi ngapain ya? 😅",
        "Wah, seru banget! 🎉",
        "Gak ngerti deh, haha! 😂",
        "Sedih banget, bro. 😢",
        "Lu jangan marah ya! 😬"
    ];

    const userContext = conversationStates[sessionId] || [];
    const fullPrompt = `${logic}\nKonteks percakapan: ${userContext.join(" ")}\nContoh respons: ${examples.join(", ")}`;

    try {
        const response = await axios.post("https://luminai.my.id/", {
            content: q,
            user: sessionId,
            prompt: fullPrompt,
            webSearchMode: false // true = result with url
        });

        // Simpan respons AI ke dalam konteks percakapan
        conversationStates[sessionId] = userContext.concat(response.data.result);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching:', error);
        throw error;
    }
};

// Define the gpt4 function
async function gpt4(txt) {
    try {
        const api = await axios.get(`https://hercai.onrender.com/turbo/hercai?question=${encodeURIComponent(txt)}`, {
            headers: {
                "content-type": "application/json",
            },
        });
        return api.data;
    } catch (e) {
        console.log(e);
        throw e; // Rethrow the error to handle it later
    }
}

// Fungsi utama untuk menangani permintaan
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const userInput = req.body.message; // User's input message
        const sessionId = req.body.sessionId || generateSessionId(); // Use sessionId from request or generate new
        const useGpt4 = req.body.useGpt4 || false; // Add a flag to switch between bots

        console.log("User  Input:", userInput);

        // Check if input is a reset command
        if (userInput.toLowerCase() === 'reset') {
            conversationStates[sessionId] = []; // Reset conversation state for this session
            return res.json({ reply: "Konteks percakapan telah direset. Mari mulai yang baru! 😊" });
        }

        try {
            let aiResponse;
            if (useGpt4) {
                aiResponse = await gpt4(userInput); // Call GPT-4 function
                console.log("GPT-4 Response:", aiResponse); // Log the response

                // Periksa struktur respons GPT-4 dan ambil nilai yang tepat
                const reply = aiResponse?.reply || aiResponse?.data?.reply || 'Tidak ada jawaban dari GPT-4.'; // Ambil nilai yang tepat
                return res.json({ reply }); // Return the AI's reply
            } else {
                aiResponse = await luminprompt(userInput, sessionId); // Call LuminAI function
            }

            if (aiResponse) {
                console.log("AI Response:", aiResponse);
                return res.json({ reply: aiResponse }); // Send back AI response
            } else {
                const errorMsg = 'Tidak ada jawaban dari AI.';
                console.error(errorMsg);
                return res.status(500).json({ error: errorMsg });
            }
        } catch (error) {
            console.error('Error in /ask route:', error);
            return res.status(500).json({ error: error.message }); // Send error message back to client
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};