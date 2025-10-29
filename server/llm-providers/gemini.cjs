const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');
const BaseLLMProvider = require('./base.cjs');

class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    if (config.apiKey) {
      this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }
  }

  getName() {
    return 'gemini';
  }

  isAvailable() {
    return !!this.client;
  }

  supportsAudio() {
    return true;
  }

  async generateText(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Gemini API is not configured');
    }

    const model = options.model || 'gemini-2.5-flash';

    const response = await this.client.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text.trim();
  }

  async generateWithAudio(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Gemini API is not configured');
    }

    const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

    const config = {
      responseModalities: [Modality.AUDIO, Modality.TEXT],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',
          }
        }
      },
      contextWindowCompression: {
        triggerTokens: '25600',
        slidingWindow: { targetTokens: '12800' },
      },
    };

    const responseQueue = [];

    const session = await this.client.live.connect({
      model,
      callbacks: {
        onmessage: function (message) {
          responseQueue.push(message);
        },
      },
      config
    });

    session.sendClientContent({
      turns: [{ text: prompt }]
    });

    let text = '';
    const audioParts = [];
    let mimeType = '';

    let done = false;
    while (!done) {
      const message = responseQueue.shift();
      if (message) {
        if (message.serverContent?.modelTurn?.parts) {
          const part = message.serverContent?.modelTurn?.parts?.[0];
          if (part?.text) {
            text += part.text;
          }
          if (part?.inlineData) {
            audioParts.push(part.inlineData.data ?? '');
            mimeType = part.inlineData.mimeType ?? '';
          }
        }
        if (message.serverContent && message.serverContent.turnComplete) {
          done = true;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    session.close();

    return {
      text: text.trim(),
      audioParts,
      mimeType
    };
  }
}

module.exports = GeminiProvider;
