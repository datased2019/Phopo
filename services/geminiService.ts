
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
    contents: `Analyze the text and extract family members. For each person, determine their gender and family ties. 
    Use the names found in the text for fatherName, motherName, and spouseName to describe relationships.
    
    Example: "Zhang San has a son named Zhang Si. Zhang San's wife is Li Hua."
    Output: [
      {"name": "Zhang San", "gender": "male", "spouseName": "Li Hua"},
      {"name": "Li Hua", "gender": "female", "spouseName": "Zhang San"},
      {"name": "Zhang Si", "gender": "male", "fatherName": "Zhang San", "motherName": "Li Hua"}
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
            birthDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
            bio: { type: Type.STRING },
            fatherName: { type: Type.STRING, description: "The name of this person's father if mentioned" },
            motherName: { type: Type.STRING, description: "The name of this person's mother if mentioned" },
            spouseName: { type: Type.STRING, description: "The name of this person's husband or wife if mentioned" }
          },
          required: ["name", "gender"]
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
