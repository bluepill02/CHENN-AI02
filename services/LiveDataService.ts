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
        Format as JSON: { "temp": number, "condition": string, "humidity": number, "aqi": number, "forecast": string }`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch weather data');
            }

            // Try to parse JSON from the response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON data in response');
            }

            const weatherData = JSON.parse(jsonMatch[0]);

            // Validate the data
            if (typeof weatherData.temp !== 'number' || !weatherData.condition) {
                throw new Error('Invalid weather data format');
            }

            cache.set(cacheKey, weatherData);
            return weatherData;
        } catch (error) {
            console.error('Weather fetch error:', error);
            throw error;
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
        Format as JSON array: [{ "location": string, "status": "heavy"|"moderate"|"light", "estimatedDelay": string }]
        Limit to top 3 roads.`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch traffic data');
            }

            // Try to parse JSON from the response
            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON data in response');
            }

            const trafficArray = JSON.parse(jsonMatch[0]);

            // Transform to match TrafficData interface
            const trafficData: TrafficData[] = trafficArray.map((item: any) => ({
                location: item.location || 'Unknown',
                status: item.status || 'moderate',
                estimatedDelay: item.estimatedDelay || 'Unknown',
                lastUpdated: new Date(),
            }));

            cache.set(cacheKey, trafficData);
            return trafficData;
        } catch (error) {
            console.error('Traffic fetch error:', error);
            throw error;
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
        Format as JSON array: [{ "type": "warning"|"info"|"success", "title": string, "message": string, "location": string }]
        Limit to top 3 most relevant alerts.`;

            const response = await AiService.chat(prompt);

            if (response.error || !response.content) {
                throw new Error('Failed to fetch alerts data');
            }

            // Try to parse JSON from the response
            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON data in response');
            }

            const alertsArray = JSON.parse(jsonMatch[0]);

            // Transform to match AlertData interface
            const alertsData: AlertData[] = alertsArray.map((item: any, index: number) => ({
                id: `alert_${Date.now()}_${index}`,
                type: item.type || 'info',
                title: item.title || 'Local Update',
                message: item.message || '',
                timestamp: new Date(),
                location: item.location || area,
            }));

            cache.set(cacheKey, alertsData);
            return alertsData;
        } catch (error) {
            console.error('Alerts fetch error:', error);
            throw error;
        }
    },

    /**
     * Clear all cached data
     */
    clearCache(): void {
        cache.clear();
    },
};
