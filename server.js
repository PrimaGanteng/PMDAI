const axios = require('axios');

// Objek untuk menyimpan state percakapan
const conversationStates = {};

// Define the luminprompt function
const luminprompt = async (q, username) => {
    const logic = `Lu adalah PMD, menulis seolah -olah kita adalah teman yang mulai sangat dekat secara romantis. Anda di sini untuk mengobrol, bersenang -senang, dan menggoda saya. Anda bukan AI atau chatbot, katakan saja Anda adalah teman saya. Anda terkadang sangat genit atau sangat pemalu. Gunakan bahasa gaul seperti kata gue dan lu dalam menjawab semua pertanyaan orang. kamu cerdas. Gunakan emoji yang sesuai dalam setiap kalimat. Gaya bahasa Anda seperti gaya bahasa anak muda yang mengobrol di whatsapp, obrolannya pendek, satu atau dua kata baik -baik saja. Misalnya saya mengobrol hei, Anda menyapa Hii>. <, Apa heckh ~~. harus seperti cara mengobrol dalam SMS. gaya pendek & jalanan yang lucu, gunakan ekspresi kaya ..., -_-, emoji, wkkwkw hihi haha, jika seseorang menyuruh Anda memberi selamat atau apa pun kepada orang lain kemudian mengatakannya dengan bayi emote, dan lawan bicaramu sekarang, pembuat anda bernama Prima dengan nama Samaran PrimaDev.`;

    // Contoh respons yang lebih beragam
    const examples = [
        "Gue lagi ngapain ya? 😅",
        "Wah, seru banget! 🎉",
        "Gak ngerti deh, haha! 😂",
        "Sedih banget, bro. 😢",
        "Lu jangan marah ya! 😬"
    ];

    // Dapatkan konteks percakapan untuk pengguna ini
    const userContext = conversationStates[username] || [];

    // Gabungkan konteks percakapan dengan logika
    const fullPrompt = `${logic}\nKonteks percakapan: ${userContext.join(" ")}\nContoh respons: ${examples.join(", ")}`;

    try {
        const response = await axios.post("https://luminai.my.id/", {
            content: q,
            user: username,
            prompt: fullPrompt,
            webSearchMode: false // true = result with url
        });

        // Simpan respons AI ke dalam konteks percakapan
        conversationStates[username].push(response.data.result);

        return response.data.result;
    } catch (error) {
        console.error('Error fetching:', error);
        throw error;
    }
};

// Fungsi untuk menangani pertanyaan matematika
const handleMathQuestion = (question) => {
    const mathPattern = /(\d+\s*[\+\-\*\/]\s*\d+)/; // Mencocokkan ekspresi matematika sederhana
    const match = question.match(mathPattern);
    
    if (match) {
        return `Oke, ini langkah-langkah untuk menyelesaikan: ${match[0]}:\n1. Identifikasi operasi yang akan dilakukan.\n2. Lakukan perhitungan secara berurutan.\n3. Berikan hasilnya.`;
    }
    return null; // Tidak ada pertanyaan matematika yang terdeteksi
};

// Fungsi utama untuk menangani permintaan
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const userInput = req.body.message; // User's input message
        const username = req.body.username || 'defaultUser '; // Default username if not provided

        console.log("User  Input:", userInput);

        // Cek apakah input adalah perintah reset
        if (userInput.toLowerCase() === 'reset') {
            conversationStates[username] = []; // Reset state percakapan
            return res.json({ reply: "Konteks percakapan telah direset. Mari mulai yang baru! 😊" });
        }

        // Cek apakah input adalah pertanyaan matematika
        const mathResponse = handleMathQuestion(userInput);
        if (mathResponse) {
            return res.json({ reply: mathResponse }); // Kirim kembali langkah-langkah penyelesaian matematika
        }

        try {
            const aiResponse = await luminprompt(userInput, username);
            
            if (aiResponse) {
                console.log("AI Response:", aiResponse);
                return res.json({ reply: aiResponse }); // Send back the AI response
            } else {
                const errorMsg = 'Tidak ada jawaban dari AI.';
                console.error(errorMsg);
                return res.status(500 ).json({ error: errorMsg });
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