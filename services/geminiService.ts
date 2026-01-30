
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ChatMessage, Role } from "../types";

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export class GeminiService {
  /**
   * Formats chat history into the structure required by the Gemini API.
   * Ensures multimodal data is only included if MIME types are officially supported.
   */
  private formatMessages(history: ChatMessage[]) {
    return history.map(msg => {
      const parts: any[] = [{ text: msg.content || ' ' }];
      
      if (msg.image && SUPPORTED_MIME_TYPES.includes(msg.image.mimeType)) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.data
          }
        });
      }

      return {
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: parts
      };
    });
  }

  /**
   * Streams a response from the Gemini model based on the provided conversation history.
   * Initializes a fresh instance for each request to ensure reliable session handling.
   */
  async *streamResponse(history: ChatMessage[]) {
    const contents = this.formatMessages(history);

    try {
      // Re-initialize for each request using the provided API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      /**
       * Fixed: Budget 0 is invalid for gemini-3-pro-preview.
       * This model is designed as a reasoning-first engine and requires a thinking budget.
       * We utilize the maximum budget (32768) to fulfill Ultrawan's identity as a 'thinking partner'.
       */
      const result = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 32768 },
          temperature: 0.7,
        },
      });

      for await (const chunk of result) {
        // Access the .text property directly as defined in SDK guidelines.
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      throw error;
    }
  }
}

export const gemini = new GeminiService();
