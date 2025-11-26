const { categorizeTransaction } = require('./aiService');

async function test() {
    console.log("Testing AI...");
    const result = await categorizeTransaction("Payment to Sportpesa 2000 KES");
    console.log("Final Category:", result);
}

test();