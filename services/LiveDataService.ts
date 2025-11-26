import { AiService } from './AiService';

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    aqi: number;
    forecast?: string;
}

interface TrafficData {
    location: string;
    status: 'heavy' | 'moderate' | 'light';
    estimatedDelay: string;
    lastUpdated: Date;
}

interface AlertData {
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    location?: string;
}

class LiveDataCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }
}

const cache = new LiveDataCache();

export const LiveDataService = {
    /**
     * Get real-time weather data for a location using AI web search
     */
    async getWeather(area: string): Promise<WeatherData> {
        const cacheKey = `weather_${area}`;
        const cached = cache.get<WeatherData>(cacheKey);
        if (cached) return cached;

        try {
            const prompt = `Search the web for CURRENT weather in ${area}, Chennai, India RIGHT NOW. 
        Return ONLY real-time data you find from weather websites.
        Include: temperature in celsius, weather condition, humidity percentage, and AQI (Air Quality Index).
        
        You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):
        {"temp": 32, "condition": "Partly Cloudy", "humidity": 75, "aqi": 85, "forecast": "Clear skies"}`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch weather data');
            }

            // Clean the response - remove markdown code blocks if present
            let cleanContent = response.content.trim();
            cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Try to parse JSON from the response
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in response:', cleanContent);
                throw new Error('No JSON data in response');
            }

            const weatherData = JSON.parse(jsonMatch[0]);

            // Validate the data with defaults
            const validatedData: WeatherData = {
                temp: typeof weatherData.temp === 'number' ? weatherData.temp : 30,
                condition: weatherData.condition || 'Unknown',
                humidity: typeof weatherData.humidity === 'number' ? weatherData.humidity : 70,
                aqi: typeof weatherData.aqi === 'number' ? weatherData.aqi : 50,
                forecast: weatherData.forecast || ''
            };

            cache.set(cacheKey, validatedData);
            return validatedData;
        } catch (error) {
            console.error('Weather fetch error:', error);
            // Return fallback data instead of throwing
            return {
                temp: 30,
                condition: 'Data unavailable',
                humidity: 70,
                aqi: 50,
                forecast: 'Unable to fetch current weather'
            };
        }
    },

    /**
     * Get real-time traffic data for a location using AI web search
     */
    async getTraffic(area: string): Promise<TrafficData[]> {
        const cacheKey = `traffic_${area}`;
        const cached = cache.get<TrafficData[]>(cacheKey);
        if (cached) return cached;

        try {
            const prompt = `Search the web for CURRENT traffic conditions in and around ${area}, Chennai RIGHT NOW.
        Return ONLY real-time traffic data you find from traffic websites or Google Maps.
        Include major roads near ${area} with their current status.
        
        You MUST respond with ONLY a valid JSON array in this exact format (no markdown, no code blocks):
        [{"location": "Anna Salai", "status": "moderate", "estimatedDelay": "10-15 mins"}]
        
        Limit to top 3 roads. Status must be one of: heavy, moderate, light`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch traffic data');
            }

            // Clean the response
            let cleanContent = response.content.trim();
            cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Try to parse JSON from the response
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('No JSON array found in response:', cleanContent);
                throw new Error('No JSON data in response');
            }

            const trafficArray = JSON.parse(jsonMatch[0]);

            // Transform to match TrafficData interface
            const trafficData: TrafficData[] = trafficArray.slice(0, 3).map((item: any) => ({
                location: item.location || 'Unknown Road',
                status: ['heavy', 'moderate', 'light'].includes(item.status) ? item.status : 'moderate',
                estimatedDelay: item.estimatedDelay || 'Unknown',
                lastUpdated: new Date(),
            }));

            cache.set(cacheKey, trafficData);
            return trafficData;
        } catch (error) {
            console.error('Traffic fetch error:', error);
            // Return fallback data
            return [{
                location: `${area} area`,
                status: 'moderate',
                estimatedDelay: 'Data unavailable',
                lastUpdated: new Date()
            }];
        }
    },

    /**
     * Get real-time local alerts/news for a location using AI web search
     */
    async getAlerts(area: string): Promise<AlertData[]> {
        const cacheKey = `alerts_${area}`;
        const cached = cache.get<AlertData[]>(cacheKey);
        if (cached) return cached;

        try {
            const prompt = `Search the web for latest local news and alerts for ${area}, Chennai from TODAY.
        Return ONLY real news/alerts you find from news websites.
        Include: traffic alerts, water supply updates, power cuts, local events, or important community updates.
        
        You MUST respond with ONLY a valid JSON array in this exact format (no markdown, no code blocks):
        [{"type": "info", "title": "Local Update", "message": "Description here", "location": "${area}"}]
        
        Type must be one of: warning, info, success
        Limit to top 3 most relevant alerts.`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch alerts data');
            }

            // Clean the response
            let cleanContent = response.content.trim();
            cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Try to parse JSON from the response
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('No JSON array found in response:', cleanContent);
                throw new Error('No JSON data in response');
            }

            const alertsArray = JSON.parse(jsonMatch[0]);

            // Transform to match AlertData interface
            const alertsData: AlertData[] = alertsArray.slice(0, 3).map((item: any, index: number) => ({
                id: `alert_${Date.now()}_${index}`,
                type: ['warning', 'info', 'success'].includes(item.type) ? item.type : 'info',
                title: item.title || 'Local Update',
                message: item.message || 'No details available',
                timestamp: new Date(),
                location: item.location || area,
            }));

            cache.set(cacheKey, alertsData);
            return alertsData;
        } catch (error) {
            console.error('Alerts fetch error:', error);
            // Return fallback data
            return [{
                id: `alert_${Date.now()}_0`,
                type: 'info',
                title: 'Welcome to Live Updates',
                message: `Stay tuned for local news and alerts for ${area}`,
                timestamp: new Date(),
                location: area
            }];
        }
    },

    /**
     * Clear all cached data
     */
    clearCache(): void {
        cache.clear();
    },
};
