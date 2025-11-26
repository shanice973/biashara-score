require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
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
                // Clear old data for a fresh demo
                await db.query('DELETE FROM transactions WHERE sme_id = 1');

                for (const row of results) {
                    const desc = row.description || row.Description || "Unknown";
                    const amount = row.amount || row.Amount || 0;
                    const type = row.type || row.Type || 'DEBIT';
                    
                    // AI Step (Safe Mode)
                    let category = "Uncategorized";
                    try {
                         category = await categorizeTransaction(desc);
                    } catch (e) {
                         console.log("Skipping AI for row:", e.message);
                    }
                    
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

// 2. DASHBOARD ROUTE (With AI Insights Logic)
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const [transactions] = await db.query('SELECT * FROM transactions WHERE sme_id = 1 ORDER BY transaction_date DESC');
        
        let score = 300;
        let totalIncome = 0;
        let totalExpense = 0;
        let aiInsights = []; // <--- NEW LIST FOR REASONS

        transactions.forEach(tx => {
            const amt = parseFloat(tx.amount);
            if (tx.type === 'CREDIT') {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                
                // RISK LOGIC
                const cat = (tx.category || '').toLowerCase();
                
                if (cat.includes('gambling') || cat.includes('betting')) {
                    score -= 50;
                    // Prevent duplicate messages
                    if (!aiInsights.some(msg => msg.includes("Gambling"))) {
                        aiInsights.push("High Risk: Gambling activity detected (-50 points).");
                    }
                }
            }
        });

        // CASH FLOW LOGIC
        if (totalIncome > totalExpense) {
            score += 100;
            aiInsights.push("Positive: Healthy Cash Flow (Income > Expenses).");
        } else {
            aiInsights.push("Negative: High Burn Rate (Expenses > Income).");
        }

        // GROWTH LOGIC
        if (transactions.length > 5) {
            score += 50;
            aiInsights.push("Positive: High Transaction Volume (+50 points).");
        }
        
        // Final Score Math
        score = Math.min(score, 850);
        score = Math.max(score, 300); // Don't go below 300

        res.json({ score, transactions, summary: { totalIncome, totalExpense }, aiInsights });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 BiasharaScore Server running on http://localhost:${PORT}`);
});