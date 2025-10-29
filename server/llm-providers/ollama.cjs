const BaseLLMProvider = require('./base.cjs');

class OllamaProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.model || 'llama3.2';
  }

  getName() {
    return 'ollama';
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  supportsAudio() {
    return false; // Ollama doesn't support native audio generation
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            num_predict: options.maxTokens || -1,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate with Ollama: ${error.message}`);
    }
  }

  async generateWithAudio(prompt, options = {}) {
    // Ollama doesn't support audio, so just return text
    const text = await this.generateText(prompt, options);
    return { text, audioParts: [], mimeType: '' };
  }

  /**
   * Get list of available models from Ollama
   * @returns {Promise<string[]>}
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.models.map(m => m.name);
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }
}

module.exports = OllamaProvider;
