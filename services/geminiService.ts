
import { GoogleGenAI, Type } from "@google/genai";
import { FamilyMember } from "../types";

/**
 * Interface for family member data returned by the AI.
 * We use parentNames for flexibility, letting the app resolve father/mother slots.
 */
export interface ParsedFamilyMember extends Partial<FamilyMember> {
  parentNames?: string[];
  spouseName?: string;
}

export const parseFamilyText = async (text: string, existingMembers: FamilyMember[] = []): Promise<ParsedFamilyMember[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contextStr = existingMembers.length > 0 
    ? `Current Tree Context: ${existingMembers.map(m => `${m.name} (${m.gender})`).join(', ')}.`
    : "The tree is currently empty.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Extract family members and their relationships from text into JSON.
    
    ${contextStr}

    Critical Rules for Relationship Extraction:
    1. Identify EVERY person. For each: name, gender (male/female), birthDate (YYYY-MM-DD), and bio.
    2. Infer gender strictly: "wife/wife/daughter" -> female; "husband/son/father" -> male.
    3. Relationships: 
       - If text says "A has a son B", B's parentNames MUST include "A".
       - If text says "A has a wife B", set A's spouseName to B AND B's spouseName to A.
       - Do not worry about "father" or "mother" labels, just use 'parentNames' array.
    4. Support incremental updates: If "Zhang San" exists and text says "Zhang San has a son Zhang Xiao", output both names and the link.
    5. Dates: Use YYYY-MM-DD. Normalize "Jan 12 2018" or "2018年1月12日".

    Example: "Xiao Hu has a son Hu Shu, born in 2018."
    Output: [
      {"name": "Xiao Hu", "gender": "male"},
      {"name": "Hu Shu", "gender": "male", "birthDate": "2018-01-01", "parentNames": ["Xiao Hu"]}
    ]

    Text to process: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["male", "female", "other"] },
            birthDate: { type: Type.STRING },
            bio: { type: Type.STRING },
            parentNames: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of names of this person's parents"
            },
            spouseName: { type: Type.STRING }
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
    console.error("AI Response Parsing Error:", e);
    return [];
  }
};
