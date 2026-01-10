
import { GoogleGenAI, Type } from "@google/genai";
import { FamilyMember } from "../types";

/**
 * Interface for family member data returned by the AI,
 * including explicit relationship fields by name.
 */
export interface ParsedFamilyMember extends Partial<FamilyMember> {
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
}

export const parseFamilyText = async (text: string): Promise<ParsedFamilyMember[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the family-related text and extract members with their attributes and relationships. 
    
    Strict Requirements:
    1. Extract 'name', 'gender' (male/female/other), 'birthDate' (YYYY-MM-DD), and 'bio'.
    2. Normalize all dates to YYYY-MM-DD. If only a year is mentioned, use YYYY-01-01.
    3. Use 'fatherName', 'motherName', and 'spouseName' strings to define connections based on the text.
    4. If the text provides details for an existing person or describes a new one, capture all available info.
    
    Example Input: "Zhang San was born on April 11, 1985. His wife is Li Hua."
    Output: [
      {"name": "Zhang San", "gender": "male", "birthDate": "1985-04-11", "spouseName": "Li Hua", "bio": "Born on April 11, 1985."},
      {"name": "Li Hua", "gender": "female", "spouseName": "Zhang San"}
    ]

    Text to parse: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            gender: { type: Type.STRING, description: "male, female, or other" },
            birthDate: { type: Type.STRING, description: "Strictly YYYY-MM-DD format" },
            bio: { type: Type.STRING, description: "Personal story or notes" },
            fatherName: { type: Type.STRING, description: "Name of the father" },
            motherName: { type: Type.STRING, description: "Name of the mother" },
            spouseName: { type: Type.STRING, description: "Name of the spouse" }
          },
          required: ["name"]
        }
      }
    }
  });

  const jsonStr = response.text?.trim();
  if (!jsonStr) return [];

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};
