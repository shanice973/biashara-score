const axios = require('axios');
require('dotenv').config();
const MODEL_ID = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli";
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;
const HF_API_KEY = process.env.HF_API_KEY;

async function categorizeTransaction(description) {
    // === 🚨 EMERGENCY DEMO MODE (PASTE HERE) ===
    // If the internet fails or API is slow, these rules SAVE YOUR DEMO.
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("sportpesa") || lowerDesc.includes("betika")) return "Gambling & Betting";
    if (lowerDesc.includes("kplc") || lowerDesc.includes("token")) return "Utility Bills";
    if (lowerDesc.includes("tuskys") || lowerDesc.includes("naivas")) return "Family & Personal";
    if (lowerDesc.includes("uber") || lowerDesc.includes("fuel")) return "Transport & Travel";
    if (lowerDesc.includes("mabati") || lowerDesc.includes("hardware")) return "Business Inventory";

    const candidateLabels = [
        "Business Inventory",
        "Utility Bills",
        "Rent Payments",
        "Transport & Travel",
        "Family & Personal",
        "Loan Repayment",
        "Gambling & Betting",
        "Healthcare & Medical",
        "Educational & Learning"
    ];

    try {
        console.log(`Analyzing: "${description}"...`);
        
        const response = await axios.post(
            API_URL,
            {
                inputs: description,
                parameters: { candidate_labels: candidateLabels }
            },
            {
                headers: { Authorization: `Bearer ${HF_API_KEY}` }
            }
        );

        // DEBUG: Print exactly what Hugging Face sent back
        // console.log("HF Response:", JSON.stringify(response.data, null, 2));

        // SAFETY CHECK 1: Did we get an error hidden in a 200 OK?
        if (response.data.error) {
            console.warn(`⚠️ Model Warning: ${response.data.error}`);
            // If model is loading, return a temporary safe label
            if (response.data.error.includes("loading")) {
                return "Uncategorized (Model Loading)";
            }
            return "Uncategorized";
        }

        // SAFETY CHECK 2: Does 'labels' actually exist?
        if (!response.data.labels || !response.data.labels.length) {
            console.error("❌ Unexpected Response Format:", response.data);
            return "Uncategorized";
        }

        const bestLabel = response.data.labels[0];
        console.log(`✅ Result: ${bestLabel}`);
        return bestLabel;

    } catch (error) {
        // Detailed Error Handling
        if (error.response) {
            console.error(`❌ API Error (${error.response.status}):`, error.response.data);
        } else {
            console.error("❌ Network/Code Error:", error.message);
        }
        return "Uncategorized";
    }
}

module.exports = { categorizeTransaction };