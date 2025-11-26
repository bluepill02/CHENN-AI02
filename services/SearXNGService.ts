// SearXNG Search Service - Privacy-focused metasearch engine
// SearXNG is open-source, privacy-respecting, and FREE to use

const SEARXNG_INSTANCE = import.meta.env.VITE_SEARXNG_INSTANCE || 'https://searx.be'; // Default public instance
const SEARXNG_ENABLED = import.meta.env.VITE_USE_SEARXNG !== 'false'; // Enable by default

export interface SearXNGResult {
    title: string;
    url: string;
    content: string;
    engine: string;
    parsed_url: string[];
    template?: string;
    engines?: string[];
    positions?: number[];
    score?: number;
    category?: string;
}

export interface SearXNGResponse {
    query: string;
    number_of_results: number;
    results: SearXNGResult[];
    answers?: string[];
    corrections?: string[];
    infoboxes?: Array<{
        infobox: string;
        content: string;
        engine: string;
        urls?: Array<{ title: string; url: string }>;
    }>;
    suggestions?: string[];
    unresponsive_engines?: string[];
}

export const SearXNGService = {
    /**
     * Check if SearXNG is enabled and available
     */
    isEnabled(): boolean {
        return SEARXNG_ENABLED;
    },

    /**
     * Get the configured SearXNG instance URL
     */
    getInstance(): string {
        return SEARXNG_INSTANCE;
    },

    /**
     * Search using SearXNG
     */
    async search(query: string, options: {
        categories?: string;
        engines?: string;
        language?: string;
        pageno?: number;
        time_range?: 'day' | 'week' | 'month' | 'year';
        safesearch?: 0 | 1 | 2;
    } = {}): Promise<SearXNGResponse> {
        try {
            const params = new URLSearchParams({
                q: query,
                format: 'json',
                ...(options.categories && { categories: options.categories }),
                ...(options.engines && { engines: options.engines }),
                ...(options.language && { language: options.language }),
                ...(options.pageno && { pageno: options.pageno.toString() }),
                ...(options.time_range && { time_range: options.time_range }),
                ...(options.safesearch !== undefined && { safesearch: options.safesearch.toString() })
            });

            const url = `${SEARXNG_INSTANCE}/search?${params}`;
            console.log(`SearXNG search: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`SearXNG Error: ${response.status} ${response.statusText}`);
            }

            const data: SearXNGResponse = await response.json();
            console.log(`SearXNG returned ${data.number_of_results} results`);

            return data;
        } catch (error) {
            console.error('SearXNG search error:', error);
            throw error;
        }
    },

    /**
     * Search for Chennai-specific information
     */
    async searchChennai(query: string, options: {
        category?: 'general' | 'news' | 'images' | 'videos' | 'map';
        timeRange?: 'day' | 'week' | 'month';
    } = {}): Promise<SearXNGResponse> {
        const chennaiQuery = `${query} Chennai India`;

        return this.search(chennaiQuery, {
            categories: options.category || 'general',
            time_range: options.timeRange,
            language: 'en',
            safesearch: 0
        });
    },

    /**
     * Format SearXNG results for LLM consumption
     */
    formatResults(response: SearXNGResponse): string {
        let formatted = '';

        // Add direct answers if available
        if (response.answers && response.answers.length > 0) {
            formatted += '**Direct Answers:**\n';
            response.answers.forEach(answer => {
                formatted += `- ${answer}\n`;
            });
            formatted += '\n';
        }

        // Add infoboxes if available
        if (response.infoboxes && response.infoboxes.length > 0) {
            formatted += '**Information:**\n';
            response.infoboxes.forEach(box => {
                formatted += `${box.infobox}: ${box.content}\n`;
                if (box.urls) {
                    box.urls.forEach(url => {
                        formatted += `  - ${url.title}: ${url.url}\n`;
                    });
                }
            });
            formatted += '\n';
        }

        // Add search results
        if (response.results && response.results.length > 0) {
            formatted += '**Search Results:**\n';
            response.results.slice(0, 10).forEach((result, index) => {
                formatted += `${index + 1}. **${result.title}**\n`;
                formatted += `   ${result.content}\n`;
                formatted += `   Source: ${result.url}\n`;
                if (result.engine) {
                    formatted += `   Engine: ${result.engine}\n`;
                }
                formatted += '\n';
            });
        }

        // Add suggestions if available
        if (response.suggestions && response.suggestions.length > 0) {
            formatted += '**Related Searches:**\n';
            response.suggestions.forEach(suggestion => {
                formatted += `- ${suggestion}\n`;
            });
        }

        return formatted || 'No search results found.';
    },

    /**
     * Get real-time news from Chennai
     */
    async getChennaiNews(category: string = 'general'): Promise<string> {
        const query = `latest ${category} news Chennai`;
        const results = await this.searchChennai(query, {
            category: 'news',
            timeRange: 'day'
        });
        return this.formatResults(results);
    },

    /**
     * Get current weather information
     */
    async getWeather(area: string = 'Chennai'): Promise<string> {
        const query = `current weather ${area} Chennai temperature humidity`;
        const results = await this.searchChennai(query, {
            timeRange: 'day'
        });
        return this.formatResults(results);
    },

    /**
     * Get traffic information
     */
    async getTraffic(area: string = 'Chennai'): Promise<string> {
        const query = `current traffic conditions ${area} Chennai`;
        const results = await this.searchChennai(query, {
            timeRange: 'day'
        });
        return this.formatResults(results);
    },

    /**
     * Search for local services
     */
    async searchLocalServices(serviceType: string, area: string = 'Chennai'): Promise<string> {
        const query = `${serviceType} near ${area} Chennai contact address`;
        const results = await this.searchChennai(query);
        return this.formatResults(results);
    },

    /**
     * Get temple information
     */
    async getTempleInfo(templeName?: string, area: string = 'Chennai'): Promise<string> {
        const query = templeName
            ? `${templeName} temple ${area} timings festivals`
            : `famous temples near ${area} Chennai`;
        const results = await this.searchChennai(query);
        return this.formatResults(results);
    },

    /**
     * Get bus route information
     */
    async getBusRoutes(from: string, to: string): Promise<string> {
        const query = `MTC bus routes from ${from} to ${to} Chennai`;
        const results = await this.searchChennai(query);
        return this.formatResults(results);
    },

    /**
     * Test SearXNG instance availability
     */
    async testInstance(): Promise<{ available: boolean; responseTime: number; error?: string }> {
        const startTime = Date.now();
        try {
            const response = await fetch(`${SEARXNG_INSTANCE}/search?q=test&format=json`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                return {
                    available: false,
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            return {
                available: true,
                responseTime
            };
        } catch (error: any) {
            return {
                available: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
};

/**
 * List of reliable public SearXNG instances
 * Source: https://searx.space/
 */
export const PUBLIC_SEARXNG_INSTANCES = [
    'https://searx.be',
    'https://searx.work',
    'https://search.bus-hit.me',
    'https://searx.tiekoetter.com',
    'https://search.sapti.me',
    'https://searx.fmac.xyz',
    'https://search.ononoki.org',
    'https://searx.prvcy.eu',
    'https://searx.lunar.icu'
];
