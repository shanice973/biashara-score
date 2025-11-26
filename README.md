# BiasharaScore AI 🚀
### Intelligent Credit Scoring for Kenya's "Invisible" SMEs

> **Hackathon Event:** 2025 AI Hackathon  
> **Track:** SME Financing (Expanding Access to Capital)  
> **Status:** MVP Complete

## 📌 Project Overview
BiasharaScore is an AI-powered financial enablement platform designed to help the 7 million "Credit Invisible" SMEs in Kenya.

Informal businesses (like Mama Mbogas or Jua Kali artisans) are often rejected by banks because they lack formal audit trails. BiasharaScore solves this by analyzing **raw mobile money and bank transaction data** to generate an alternative risk score.

We use **Natural Language Processing (NLP)** to contextualize transaction descriptions (distinguishing "Business Inventory" from "Gambling") and a heuristic scoring engine to measure cash flow consistency rather than collateral.

## 🛠 Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** MySQL (Relational storage for Transactions & Scores)
* **AI Engine:** Hugging Face Inference API (`MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`)
* **Frontend:** Vanilla JS, Bootstrap 5, Chart.js
* **Data Processing:** `csv-parser`, `multer`

## 🧠 AI & Logic Architecture
1.  **Ingestion:** User uploads a standard CSV bank statement.
2.  **Zero-Shot Classification:** We use a Multilingual Transformer Model (DeBERTa) to tag Swahili and English transaction descriptions into categories like:
    * ✅ *Business Inventory* (Positive Impact)
    * ✅ *Utility Bills* (Positive Impact)
    * ⚠️ *Gambling & Betting* (Negative Impact)
3.  **Explainable Scoring:** A custom Node.js engine calculates a score (0-850) and generates **Natural Language Insights** explaining *why* the score is high or low (e.g., "High Risk: Gambling Detected").

## ⚙️ Setup Instructions

### Prerequisites
* Node.js (v18 or higher)
* MySQL Server (XAMPP or Workbench)
* Git

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR-USERNAME/biashara-score.git](https://github.com/YOUR-USERNAME/biashara-score.git)
cd biashara-score