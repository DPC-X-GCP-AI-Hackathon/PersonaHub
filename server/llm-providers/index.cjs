const GeminiProvider = require('./gemini.cjs');
const OllamaProvider = require('./ollama.cjs');
const OpenAIProvider = require('./openai.cjs');

/**
 * LLM Provider Manager
 * Handles initialization and selection of LLM providers
 */
class LLMProviderManager {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  /**
   * Initialize all configured providers
   * @param {Object} config - Configuration object with provider settings
   */
  initialize(config) {
    // Initialize Gemini
    if (config.gemini?.apiKey) {
      const gemini = new GeminiProvider(config.gemini);
      this.providers.set('gemini', gemini);
      console.log('✅ Gemini provider initialized');

      if (!this.defaultProvider) {
        this.defaultProvider = 'gemini';
      }
    }

    // Initialize Ollama
    if (config.ollama?.enabled !== false) {
      const ollama = new OllamaProvider(config.ollama || {});
      this.providers.set('ollama', ollama);
      console.log('✅ Ollama provider initialized');

      if (!this.defaultProvider) {
        this.defaultProvider = 'ollama';
      }
    }

    // Initialize OpenAI
    if (config.openai?.apiKey) {
      const openai = new OpenAIProvider(config.openai);
      this.providers.set('openai', openai);
      console.log('✅ OpenAI provider initialized');

      if (!this.defaultProvider) {
        this.defaultProvider = 'openai';
      }
    }

    // Set explicit default if provided
    if (config.defaultProvider && this.providers.has(config.defaultProvider)) {
      this.defaultProvider = config.defaultProvider;
    }

    console.log(`📌 Default LLM provider: ${this.defaultProvider || 'none'}`);
  }

  /**
   * Get a specific provider by name
   * @param {string} providerName - Name of the provider
   * @returns {BaseLLMProvider|null}
   */
  getProvider(providerName) {
    return this.providers.get(providerName) || null;
  }

  /**
   * Get the default provider
   * @returns {BaseLLMProvider|null}
   */
  getDefaultProvider() {
    return this.defaultProvider ? this.providers.get(this.defaultProvider) : null;
  }

  /**
   * Get list of available provider names
   * @returns {Promise<Array<{name: string, available: boolean, supportsAudio: boolean}>>}
   */
  async getAvailableProviders() {
    const providers = [];

    for (const [name, provider] of this.providers) {
      const available = await (typeof provider.isAvailable === 'function'
        ? provider.isAvailable()
        : true);

      providers.push({
        name,
        available,
        supportsAudio: provider.supportsAudio(),
        isDefault: name === this.defaultProvider
      });
    }

    return providers;
  }

  /**
   * Generate text using specified or default provider
   * @param {string} prompt - The prompt
   * @param {Object} options - Options including provider name
   * @returns {Promise<string>}
   */
  async generateText(prompt, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new Error(`Provider '${providerName}' not found or not configured`);
    }

    return provider.generateText(prompt, options);
  }

  /**
   * Generate text with audio using specified or default provider
   * @param {string} prompt - The prompt
   * @param {Object} options - Options including provider name
   * @returns {Promise<{text: string, audioParts: string[], mimeType: string}>}
   */
  async generateWithAudio(prompt, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new Error(`Provider '${providerName}' not found or not configured`);
    }

    return provider.generateWithAudio(prompt, options);
  }
}

// Create singleton instance
const providerManager = new LLMProviderManager();

module.exports = providerManager;
