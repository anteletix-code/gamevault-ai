
import { GoogleGenAI, Type } from "@google/genai";
import { GameFileMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AnalysisResult {
  metadata: GameFileMetadata;
  htmlPage: string;
}

export const analyzeAndConvertGameFile = async (fileName: string, fileType: string): Promise<AnalysisResult> => {
  const prompt = `You are a professional game archivist. 
  Analyze this game file for public distribution:
  File Name: ${fileName}
  File Type: ${fileType}
  
  1. Provide structured metadata (title, category, description, tags, genre, safety).
  2. Generate a complete, high-quality, standalone HTML "Public Landing Page" for this asset. 
     - Use Tailwind CSS via CDN.
     - Include a hero section with the asset title.
     - Include an "About" section using the description.
     - Add a "Technical Specifications" table.
     - Include a stylized "Download / Play" call to action (simulated).
     - Use a dark, futuristic gamer aesthetic (Indigo/Slate colors).
     - Ensure it is a single string containing the full <!DOCTYPE html>...</html>.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metadata: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedGenre: { type: Type.STRING },
                safetyRating: { type: Type.STRING }
              },
              required: ['title', 'category', 'description', 'suggestedTags', 'estimatedGenre', 'safetyRating']
            },
            htmlPage: { type: Type.STRING, description: 'The full HTML code for the landing page' }
          },
          required: ['metadata', 'htmlPage']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis/Conversion Error:", error);
    const fallbackMetadata = {
      title: fileName,
      category: "Unknown",
      description: "Analysis failed.",
      suggestedTags: ["error"],
      estimatedGenre: "Unknown",
      safetyRating: "Review Needed"
    };
    return {
      metadata: fallbackMetadata,
      htmlPage: `<html><body><h1>${fileName}</h1><p>Manual review required.</p></body></html>`
    };
  }
};

export const generateCoverArt = async (title: string, genre: string, description: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Create a cinematic, high-quality game cover art for a ${genre} game titled "${title}". 
          The description of the game is: ${description}. 
          Style: modern, digital illustration, epic lighting, no text on image.`,
        }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Cover Art Generation Error:", error);
  }
  return undefined;
};
