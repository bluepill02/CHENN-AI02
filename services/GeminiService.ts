import { GoogleGenerativeAI } from '@google/generative-ai';
import { SearXNGService } from './SearXNGService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CACHE_KEY = 'chennai_live_updates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Initialize Gemini Client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-2.0-flash-lite-preview-02-05';

export interface LiveUpdateResponse {
    text: string;
    source: 'cache' | 'gemini-searxng' | 'gemini-grounding' | 'error';
    timestamp: number;
}

export const GeminiService = {
    /**
     * Get live updates for a specific location in Chennai
     */
    async getLiveUpdates(location: string = 'Chennai'): Promise<LiveUpdateResponse> {
        // 1. Check Cache
        const cacheKey = `${CACHE_KEY}_${location}`;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            console.log(`Serving Live Updates for ${location} from Cache`);
            return cachedData;
        }

        if (!genAI) {
            console.warn('Gemini API Key missing');
            return {
                text: 'Live updates unavailable (API Key missing).',
                source: 'error',
                timestamp: Date.now()
            };
        }

        try {
            // 2. Try Fetching Data from SearXNG
            console.log(`Fetching fresh data for ${location} from SearXNG...`);
            const [news, weather, traffic, events] = await Promise.allSettled([
                SearXNGService.getChennaiNews('general', location),
                SearXNGService.getWeather(location),
                SearXNGService.getTraffic(location),
                SearXNGService.searchChennai(`events happening in ${location} today`, { timeRange: 'week' })
            ]);

            const newsText = news.status === 'fulfilled' ? news.value : '';
            const weatherText = weather.status === 'fulfilled' ? weather.value : '';
            const trafficText = traffic.status === 'fulfilled' ? traffic.value : '';
            const eventsText = events.status === 'fulfilled' ? SearXNGService.formatResults(events.value) : '';

            // Check if we got meaningful data from SearXNG
            const hasData = newsText.length > 100 || weatherText.length > 50;

            if (hasData) {
                // 3a. Summarize SearXNG Data using Gemini
                console.log('Summarizing SearXNG data with Gemini...');
                const summary = await this.summarizeWithGemini(newsText, weatherText, trafficText, eventsText, location);

                const response: LiveUpdateResponse = {
                    text: summary,
                    source: 'gemini-searxng',
                    timestamp: Date.now()
                };

                this.saveToCache(cacheKey, response);
                return response;
            } else {
                // 3b. Fallback: Gemini Web Search (Grounding)
                console.warn('SearXNG returned insufficient data. Falling back to Gemini Grounding...');
                const groundingText = await this.fetchWithGeminiGrounding(location);

                const response: LiveUpdateResponse = {
                    text: groundingText,
                    source: 'gemini-grounding',
                    timestamp: Date.now()
                };

                this.saveToCache(cacheKey, response);
                return response;
            }

        } catch (error) {
            console.error('GeminiService Error:', error);
            return {
                text: 'Unable to fetch live updates at the moment.',
                source: 'error',
                timestamp: Date.now()
            };
        }
    },

    /**
     * Summarize raw text data using Gemini
     */
    async summarizeWithGemini(news: string, weather: string, traffic: string, events: string, location: string): Promise<string> {
        if (!genAI) return '';

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
        You are a local Chennai news assistant. Summarize the following real-time data for **${location}** into a single, scrolling-ticker style update.
        
        Constraints:
        - Max 2-3 sentences.
        - Use "Tanglish" (Tamil + English) style.
        - Include emojis.
        - **CRITICAL**: Focus strictly on ${location} if data is available. If not, fallback to general Chennai news but mention it's general.
        - Include: Weather, Traffic, Major News, and any Events.
        - Format: "📢 [Weather] | [Traffic] | [News/Events]"
        
        Data:
        News: ${news.substring(0, 2000)}
        Weather: ${weather.substring(0, 500)}
        Traffic: ${traffic.substring(0, 500)}
        Events: ${events.substring(0, 500)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    },

    /**
     * Fetch data using Gemini's built-in Google Search (Grounding)
     */
    async fetchWithGeminiGrounding(location: string): Promise<string> {
        if (!genAI) return '';

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            tools: [{ googleSearch: {} } as any]
        });

        const prompt = `Find the latest live updates for **${location}, Chennai**, regarding Weather, Traffic, and Breaking News right now. Summarize it into a single Tanglish ticker line with emojis. Format: "📢 [Weather] | [Traffic] | [News]"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    },

    /**
     * Cache Management
     */
    getFromCache(key: string): LiveUpdateResponse | null {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const data: LiveUpdateResponse = JSON.parse(cached);
            const age = Date.now() - data.timestamp;

            if (age < CACHE_DURATION) {
                return data;
            } else {
                localStorage.removeItem(key); // Expired
                return null;
            }
        } catch (e) {
            return null;
        }
    },

    saveToCache(key: string, data: LiveUpdateResponse) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to cache live updates', e);
        }
    }
};
