const https = require('https');

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DDG_API_URL = 'https://api.duckduckgo.com/';

// Helper for fetch in Node (using built-in fetch if available, else https)
// Node 18+ has fetch. Assuming Node 18+.
const doFetch = async (url, options) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorText}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Fetch failed:", e);
        throw e;
    }
};

async function testGroq() {
    console.log('\n--- Testing Groq API (Batch Request) ---');
    const area = 'T. Nagar';
    const query = `
        Search the web for current live data in ${area}, Chennai RIGHT NOW.
        Return a single JSON object with the following structure:
        {
            "weather": {
                "temp": number (celsius),
                "condition": string,
                "humidity": number,
                "aqi": number,
                "forecast": string
            },
            "traffic": {
                "level": "low" | "medium" | "high",
                "roads": [{ "name": string, "status": string }] (top 3 major roads nearby)
            },
            "busRoutes": {
                "routes": [{ "number": string, "frequency": string, "duration": string }] (top 3 routes passing through ${area})
            },
            "temples": {
                "temples": [{ "name": string, "timings": string, "festivals": [{ "name": string, "date": string }], "address": string }] (top 2 famous temples nearby)
            },
            "news": {
                "news": [{ "title": string, "summary": string, "source": string, "time": string }] (top 3 latest local news items)
            }
        }
        CRITICAL: 
        - Use real-time data from web search.
        - Do not make up data.
        - If specific data is unavailable, return null for that field but try to fill others.
    `;

    try {
        const data = await doFetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{
                    role: 'system',
                    content: `You are a Chennai data assistant. User is in ${area}, Chennai.
          
          CRITICAL INSTRUCTIONS:
          1. You MUST use web search to get current, real-time data
          2. DO NOT generate or make up any information
          3. Only return data found through web search
          4. If web search returns no results, return: {"error": "No data found"}
          5. Always return valid JSON matching the requested format
          6. Include "sources" field with URLs when possible`
                }, {
                    role: 'user',
                    content: query
                }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        console.log("Groq Response Status: OK");
        const content = JSON.parse(data.choices[0].message.content);
        console.log("Groq Data Preview:", JSON.stringify(content, null, 2).substring(0, 500) + "...");

        if (content.weather && content.traffic) {
            console.log("✅ Groq Batch Request Successful: Weather and Traffic data present.");
        } else {
            console.warn("⚠️ Groq Batch Request returned partial or missing data.");
        }

    } catch (error) {
        console.error("❌ Groq Test Failed:", error.message);
    }
}

async function testDuckDuckGo() {
    console.log('\n--- Testing DuckDuckGo API ---');
    const query = 'weather in Chennai';
    const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_html: '1',
        skip_disambig: '1'
    });

    try {
        const data = await doFetch(`${DDG_API_URL}?${params.toString()}`);
        console.log("DDG Response Status: OK");
        console.log("DDG Abstract:", data.Abstract || "No Abstract");
        console.log("DDG AbstractText:", data.AbstractText || "No AbstractText");
        console.log("DDG RelatedTopics Count:", data.RelatedTopics ? data.RelatedTopics.length : 0);

        if (data) {
            console.log("✅ DuckDuckGo Request Successful.");
        }
    } catch (error) {
        console.error("❌ DuckDuckGo Test Failed:", error.message);
    }
}

async function run() {
    await testGroq();
    await testDuckDuckGo();
}

run();
