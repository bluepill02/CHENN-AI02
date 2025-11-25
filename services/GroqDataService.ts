const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqDataRequest {
    query: string;
    location?: {
        area: string;
        pincode: string;
    };
}

export interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    aqi: number;
    forecast?: string;
}

export interface BusRoute {
    number: string;
    frequency: string;
    duration: string;
    stops?: string[];
}

export interface TrafficData {
    level: 'low' | 'medium' | 'high';
    roads: Array<{ name: string; status: string }>;
}

export interface TempleInfo {
    name: string;
    timings: string;
    festivals: Array<{ name: string; date: string }>;
    address: string;
}

export interface NewsItem {
    title: string;
    summary: string;
    source: string;
    time: string;
}

export interface DashboardData {
    weather: WeatherData;
    traffic: TrafficData;
    busRoutes: { routes: BusRoute[] };
    temples: { temples: TempleInfo[] };
    news: { news: NewsItem[] };
}

export const GroqDataService = {
    /**
     * Get user's location from localStorage
     */
    getUserLocation(): { area: string; pincode: string } | undefined {
        const area = localStorage.getItem('user_area');
        const pincode = localStorage.getItem('user_pincode');

        if (!area || !pincode) return undefined;

        return { area, pincode };
    },



    /**
     * Get weather for user's location
     */
    /**
     * Get weather for user's location
     */
    /**
     * Get weather for user's location
     */
    async getWeather(): Promise<WeatherData> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData<WeatherData>({
            query: `Search the web for CURRENT weather in ${area}, Chennai, India RIGHT NOW. 
              Include: temperature in celsius, condition, humidity percentage, 
              AQI (Air Quality Index), and brief forecast for next 6 hours.
              Return as JSON with keys: temp, condition, humidity, aqi, forecast`,
            location
        });
    },

    /**
     * Get bus routes from user's area
     */
    async getBusRoutes(destination: string): Promise<{ routes: BusRoute[] }> {
        const location = this.getUserLocation();
        const from = location?.area || 'Chennai';

        return this.fetchStructuredData<{ routes: BusRoute[] }>({
            query: `Search the web for CURRENT MTC bus routes from ${from} to ${destination} in Chennai.
              Include route numbers, frequency (how often buses run), 
              and approximate travel time.
              Return as JSON: { routes: [{ number, frequency, duration }] }`,
            location
        });
    },

    /**
     * Get nearby bus routes for user's area
     */
    async getNearbyBusRoutes(): Promise<{ routes: BusRoute[] }> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData<{ routes: BusRoute[] }>({
            query: `Search the web for major MTC bus routes that pass through or near ${area}, Chennai.
              Include route numbers, main destinations, and frequency.
              Return as JSON: { routes: [{ number, frequency, duration }] }`,
            location
        });
    },

    /**
     * Get traffic conditions for user's area
     */
    async getTraffic(): Promise<TrafficData> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData<TrafficData>({
            query: `Search the web for CURRENT traffic conditions in and around ${area}, Chennai RIGHT NOW.
              Include overall congestion level (low/medium/high) and 
              status of major nearby roads.
              Return as JSON: { level, roads: [{ name, status }] }`,
            location
        });
    },

    /**
     * Get nearby temples for user's area
     */
    async getNearbyTemples(): Promise<{ temples: TempleInfo[] }> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData<{ temples: TempleInfo[] }>({
            query: `Search the web for famous temples near ${area}, Chennai.
              Include temple names, timings, upcoming festivals, and addresses.
              Return as JSON: { temples: [{ name, timings, festivals: [{ name, date }], address }] }`,
            location
        });
    },

    /**
     * Get specific temple info
     */
    async getTempleInfo(templeName: string): Promise<TempleInfo> {
        const location = this.getUserLocation();

        return this.fetchStructuredData<TempleInfo>({
            query: `Search the web for information about ${templeName} temple in Chennai.
              Include timings, upcoming festivals, and address.
              Return as JSON: { name, timings, festivals: [{ name, date }], address }`,
            location
        });
    },

    /**
     * Get local news for user's area
     */
    async getLocalNews(category = 'general'): Promise<{ news: NewsItem[] }> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData<{ news: NewsItem[] }>({
            query: `Search the web for latest ${category} news from ${area} and Chennai TODAY.
              Focus on local news relevant to ${area} area.
              Return top 5 as JSON: { news: [{ title, summary, source, time }] }`,
            location
        });
    },

    /**
     * Get local events for user's area
     */
    async getLocalEvents(): Promise<{ events: Array<{ name: string; date: string; location: string; description: string }> }> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData({
            query: `Search the web for upcoming events, festivals, and community activities in ${area}, Chennai.
              Include cultural events, temple festivals, and local gatherings.
              Return as JSON: { events: [{ name, date, location, description }] }`,
            location
        });
    },

    /**
     * Get nearby services (hospitals, police, etc.)
     */
    async getNearbyServices(serviceType: string): Promise<{ services: Array<{ name: string; address: string; phone: string; distance: string }> }> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        return this.fetchStructuredData({
            query: `Search the web for ${serviceType} near ${area}, Chennai.
              Include name, address, contact number, and approximate distance.
              Return as JSON: { services: [{ name, address, phone, distance }] }`,
            location
        });
    },

    /**
     * Fetch all dashboard data in a single batch request
     */
    async getDashboardData(): Promise<DashboardData> {
        const location = this.getUserLocation();
        const area = location?.area || 'Chennai';

        // We construct a single prompt to get all data at once
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

        return this.fetchStructuredData<DashboardData>({
            query,
            location
        });
    },

    /**
     * Fetch structured data from Groq with location context
     * CRITICAL: Forces web search only, no generative responses
     */
    /**
     * Fetch structured data from Groq with location context
     * CRITICAL: Forces web search only, no generative responses
     */
    /**
     * Fetch structured data from Groq with location context
     * CRITICAL: Forces web search only, no generative responses
     */
    async fetchStructuredData<T>(request: GroqDataRequest): Promise<T> {
        if (!GROQ_API_KEY) {
            throw new Error('Groq API Key is missing');
        }

        const location = request.location || this.getUserLocation();
        const locationContext = location
            ? `User is in ${location.area}, Chennai (Pincode: ${location.pincode}). `
            : 'User is in Chennai. ';

        // List of high-limit models to try in order
        const MODELS = [
            'llama-3.3-70b-versatile', // Best quality
            'llama-3.1-70b-versatile', // High quality fallback
            'llama-3.1-8b-instant',    // Fast, high throughput
            'mixtral-8x7b-32768',      // Good alternative architecture
            'gemma2-9b-it'             // Google's model as final backup
        ];

        let lastError;

        // Try each model in sequence
        for (const model of MODELS) {
            try {
                console.log(`Attempting fetch with model: ${model}`);

                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{
                            role: 'system',
                            content: `You are a Chennai data assistant. ${locationContext}
          
          CRITICAL INSTRUCTIONS:
          1. You MUST use web search to get current, real-time data
          2. DO NOT generate or make up any information
          3. Only return data found through web search
          4. If web search returns no results, return: {"error": "No data found"}
          5. Always return valid JSON matching the requested format
          6. Include "sources" field with URLs when possible`
                        }, {
                            role: 'user',
                            content: request.query
                        }],
                        response_format: { type: 'json_object' },
                        temperature: 0.1,
                        max_tokens: 2000
                    })
                });

                // If rate limited, throw specific error to trigger next model
                if (response.status === 429) {
                    throw new Error(`Rate Limit (429) on ${model}`);
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Groq API Error on ${model}: ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                const result = JSON.parse(data.choices[0].message.content);

                if (result.error) {
                    throw new Error(result.error);
                }

                console.log(`Success with model: ${model}`);
                return result;

            } catch (error: any) {
                console.warn(`Failed with model ${model}:`, error.message);
                lastError = error;
                // Continue to next model loop
                continue;
            }
        }

        // If all models fail, throw the last error
        console.error('All models failed.');
        throw lastError;
    }
};
