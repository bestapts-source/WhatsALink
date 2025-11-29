import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

// Helper to safely get the API key without crashing in non-Node environments
const getApiKey = (): string | null => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // access to process failed, likely browser environment without polyfill
  }
  return null;
};

const extractPhoneNumber = async (text: string): Promise<ExtractionResult | null> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("API Key is missing. AI extraction skipped. Please configure process.env.API_KEY in your hosting environment.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const model = "gemini-2.5-flash";

    const prompt = `
      Analyze the following text and extract the primary phone number.
      Format the output as a clean string of digits suitable for the WhatsApp API (International format).
      
      Formatting Rules:
      1. Remove all non-digit characters.
      2. If the number starts with "05" (Israeli Mobile format), replace the leading "0" with "972". (Example: 0501234567 -> 972501234567).
      3. If the number implies a specific country code (e.g., starts with +, 1, 44, 91), ensure it is preserved without the +.
      4. If multiple numbers exist, choose the most likely mobile number.
      
      Input Text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            found: { type: Type.BOOLEAN },
            phoneNumber: { type: Type.STRING, description: "The cleaned digits only." },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
            countryCodeDetected: { type: Type.BOOLEAN }
          },
          required: ["found", "phoneNumber", "confidence", "countryCodeDetected"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    if (result.found && result.phoneNumber) {
      return {
        phoneNumber: result.phoneNumber,
        confidence: result.confidence,
        countryCodeDetected: result.countryCodeDetected
      };
    }

    return null;

  } catch (error) {
    console.error("Gemini extraction error:", error);
    return null;
  }
};

export { extractPhoneNumber };