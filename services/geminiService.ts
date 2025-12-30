
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMedicalInsights = async (medicineName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a brief professional overview of the medicine "${medicineName}". Include primary uses, common side effects, and any critical drug interactions. Keep it concise for a pharmacist's quick reference.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not retrieve AI insights at this moment.";
  }
};

export const checkDrugInteractions = async (medicines: string[]) => {
  if (medicines.length < 2) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Check if there are any dangerous drug-drug interactions between these medicines: ${medicines.join(", ")}. If there are, provide a 1-sentence warning for a pharmacist. If safe, respond "No significant interactions detected."`,
      config: {
        temperature: 0.1,
      }
    });
    return response.text;
  } catch (error) {
    return null;
  }
};

export const parsePrescription = async (text: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract medicine names and quantities from the following text (which might be a raw prescription dump). Return as JSON format:
        
        Text: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    dosageInstructions: { type: Type.STRING }
                  },
                  required: ["name", "quantity"]
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      return { items: [] };
    }
  };
