require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const ss = require('simple-statistics'); // Math library
const db = require('./db');
const { categorizeTransaction } = require('./aiService');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. UPLOAD ROUTE
app.post('/api/upload', upload.single('statement'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Clear old data for demo purposes
                await db.query('DELETE FROM transactions WHERE sme_id = 1');

                for (const row of results) {
                    const desc = row.description || row.Description || "Unknown";
                    const amount = row.amount || row.Amount || 0;
                    const type = row.type || row.Type || 'DEBIT';
                    
                    // Run AI (with fallback)
                    let category = "Uncategorized";
                    try { category = await categorizeTransaction(desc); } catch (e) {}
                    
                    await db.query(
                        `INSERT INTO transactions (sme_id, transaction_date, amount, type, description, category) VALUES (?, NOW(), ?, ?, ?, ?)`,
                        [1, amount, type, desc, category]
                    );
                }
                fs.unlinkSync(filePath); 
                res.json({ message: "Success", success: true });

            } catch (error) {
                console.error("Processing Error:", error);
                res.status(500).json({ error: "Failed to process transactions" });
            }
        });
});

// 2. DASHBOARD ROUTE (With Prediction & Loan Logic)
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const [transactions] = await db.query('SELECT * FROM transactions WHERE sme_id = 1 ORDER BY transaction_date DESC');
        
        let score = 500; 
        let totalIncome = 0;
        let totalExpense = 0;
        let aiInsights = [];
        let incomeHistory = []; 

        transactions.forEach((tx) => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'CREDIT') {
                totalIncome += amt;
                incomeHistory.push(amt);
            } else {
                totalExpense += amt;
                
                // Risk Logic
                const cat = (tx.category || '').toLowerCase();
                if (cat.includes('gambling') || cat.includes('betting')) {
                    score -= 100;
                    if (!aiInsights.some(msg => msg.includes("Gambling"))) {
                        aiInsights.push("⚠️ High Risk: Gambling activity detected (-100 pts).");
                    }
                }
            }
        });

        // Scoring Logic
        if (totalIncome > totalExpense) {
            score += 100;
            aiInsights.push("✅ Positive: Healthy Cash Flow (+100 pts).");
        } else {
            score -= 50;
            aiInsights.push("❌ Negative: Spending more than you earn (-50 pts).");
        }

        if (transactions.length > 5) score += 50;
        if (totalIncome > 50000) {
             score += 100;
             aiInsights.push("✅ Positive: High Revenue Business (+100 pts).");
        }

        score = Math.min(score, 850);
        score = Math.max(score, 300);

        // Feature 1: AI Prediction
        let forecastMsg = "Insufficient data.";
        if (incomeHistory.length >= 2) {
            const trendData = incomeHistory.reverse().map((amt, i) => [i + 1, amt]);
            const regressionLine = ss.linearRegression(trendData);
            const growth = regressionLine.m > 0 ? "Growing 📈" : "Stable";
            forecastMsg = `Revenue Trend: ${growth}`;
        }

        // Feature 2: Loan Matcher
        let loanOffer = { amount: 0, status: "Locked" };
        if (score >= 700) {
            loanOffer = { amount: Math.round(totalIncome * 0.4), status: "Pre-Approved ✅" };
        } else if (score >= 500) {
            loanOffer = { amount: Math.round(totalIncome * 0.15), status: "Micro-Loan Only ⚠️" };
        }

        res.json({ 
            score, 
            transactions, 
            summary: { totalIncome, totalExpense }, 
            aiInsights,
            prediction: { forecastMsg },
            loanOffer
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// START THE SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 BiasharaScore Server running on http://localhost:${PORT}`);
});