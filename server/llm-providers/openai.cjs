const BaseLLMProvider = require('./base.cjs');

/**
 * OpenAI-compatible provider
 * Works with OpenAI, Azure OpenAI, and other OpenAI-compatible APIs
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.model || 'gpt-4o-mini';
  }

  getName() {
    return 'openai';
  }

  isAvailable() {
    return !!this.apiKey;
  }

  supportsAudio() {
    return false; // Can be extended for TTS support
  }

  async generateText(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const model = options.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw new Error(`Failed to generate with OpenAI: ${error.message}`);
    }
  }
}

module.exports = OpenAIProvider;
