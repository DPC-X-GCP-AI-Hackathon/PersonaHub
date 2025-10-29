/**
 * Base LLM Provider Interface
 * All LLM providers must implement these methods
 */
class BaseLLMProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate text response from a prompt
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<string>} - The generated text
   */
  async generateText(prompt, options = {}) {
    throw new Error('generateText must be implemented by subclass');
  }

  /**
   * Generate text with audio response (if supported)
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Additional options
   * @returns {Promise<{text: string, audioParts?: string[], mimeType?: string}>}
   */
  async generateWithAudio(prompt, options = {}) {
    // Default implementation: just return text without audio
    const text = await this.generateText(prompt, options);
    return { text, audioParts: [], mimeType: '' };
  }

  /**
   * Check if this provider supports audio generation
   * @returns {boolean}
   */
  supportsAudio() {
    return false;
  }

  /**
   * Get the name of this provider
   * @returns {string}
   */
  getName() {
    throw new Error('getName must be implemented by subclass');
  }

  /**
   * Check if the provider is available/configured
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error('isAvailable must be implemented by subclass');
  }
}

module.exports = BaseLLMProvider;
