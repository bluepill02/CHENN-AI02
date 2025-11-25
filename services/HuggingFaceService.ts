const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';

export const HuggingFaceService = {
    async chat(message: string, systemPrompt: string): Promise<string> {
        if (!HF_API_KEY) {
            throw new Error('Hugging Face API Key is missing');
        }

        try {
            // HF Inference API often takes a single prompt string for instruct models
            // We format it as a simple chat structure
            const fullPrompt = `<s>[INST] ${systemPrompt}\n\n${message} [/INST]`;

            const response = await fetch(HF_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HF_API_KEY}`
                },
                body: JSON.stringify({
                    inputs: fullPrompt,
                    parameters: {
                        max_new_tokens: 500,
                        temperature: 0.7,
                        return_full_text: false
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hugging Face API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // HF returns an array of objects with 'generated_text'
            if (Array.isArray(data) && data.length > 0) {
                return data[0].generated_text.trim();
            } else if (data.generated_text) {
                return data.generated_text.trim();
            }

            throw new Error('Unexpected response format from Hugging Face');
        } catch (error) {
            console.error('Hugging Face Service Error:', error);
            throw error;
        }
    }
};
