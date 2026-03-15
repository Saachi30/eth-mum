const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const parseIntent = async (userInput) => {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are an AI assistant for a blockchain REC (Renewable Energy Certificate) trading platform.
Parse this user request and respond with a JSON object containing 'function' and 'parameters'.
Available functions: mintTokens, burnTokens, listTokens, cancelListing, transferTokens.
Energy types allowed: solar, wind, hydro, biomass, geothermal. Respond in the language of the user.

User request: "${userInput}"

If the request doesn't match any function, respond with:
{
  "function": "chat",
  "response": "your helpful response about RECs"
}

For functions, respond with format:
{
  "function": "mintTokens",
  "parameters": {
    "amount": "100",
    "energyType": "solar"
  }
}`;

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.1,
                topP: 1,
                topK: 1,
                maxOutputTokens: 1000,
            }
        }
    );

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("Invalid response from Gemini API");

    try {
        return JSON.parse(aiText.trim());
    } catch (e) {
        throw new Error("Failed to parse AI response as JSON");
    }
};

module.exports = {
    parseIntent
};
