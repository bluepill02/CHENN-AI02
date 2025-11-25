const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

export const AzureOpenAIService = {
    async chat(message: string, systemPrompt: string): Promise<string> {
        if (!AZURE_ENDPOINT || !AZURE_API_KEY || !AZURE_DEPLOYMENT) {
            throw new Error('Azure OpenAI credentials missing');
        }

        try {
            // Construct URL: endpoint + "chat/completions"
            // Note: The user provided endpoint ends with /v1/, so we append chat/completions
            const url = `${AZURE_ENDPOINT}chat/completions`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': AZURE_API_KEY
                },
                body: JSON.stringify({
                    model: AZURE_DEPLOYMENT,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure OpenAI Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Azure OpenAI Service Error:', error);
            throw error;
        }
    }
};
