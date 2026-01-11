import { GoogleGenAI } from "@google/genai";
import { VisionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini Vision to estimate the distance between a golf ball and the hole.
 * Refined prompt provides specific instructions on scaling cues and technical reasoning.
 */
export const estimateDistanceWithAI = async (base64Image: string): Promise<VisionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: `Analyze this golf green image for professional distance estimation.
              
1. IDENTIFY: Locate the golf ball and the center of the cup (hole) or flagstick.
2. SCALE: Use the standard golf cup diameter (4.25 inches) or the flagstick thickness as a reference scale. Consider perspective and lens foreshortening.
3. ESTIMATE: Calculate the linear distance between the ball and hole in feet.
4. EXPLAIN: Provide a technical breakdown of how you derived this number (e.g., "Using the 4.25 inch cup as a reference, the ball lies approximately 14 cup-lengths away, adjusted for perspective...").

Return ONLY a JSON object with these keys: 
'distance': (number, representing feet)
'explanation': (string, a concise technical reasoning for the estimate)`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const result = JSON.parse(text);
    return {
      distance: typeof result.distance === 'number' ? result.distance : 10,
      explanation: result.explanation || "Analyzed using spatial computer vision based on standard cup sizing."
    };
  } catch (error) {
    console.error("AI Estimation Error:", error);
    return { 
      distance: 10, 
      explanation: "Error communicating with AI. Defaulting to 10ft." 
    };
  }
};