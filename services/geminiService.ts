
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
    ? `Current Tree Context (Names/IDs): ${existingMembers.map(m => `${m.name} (${m.gender}, id:${m.id})`).join(', ')}.`
    : "The tree is currently empty.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Extract family members and relationships from text to update a family tree.

    ${contextStr}

    CRITICAL RULES:
    1. **Identify Everyone**: Extract name, gender (infer strictly from terms like son/daughter/wife/husband), birthDate, and bio.
    2. **Implicit Relationships**: 
       - If "A is B's son", return A with parentNames=["B"].
       - If "A is B's wife", return A with spouseName="B" AND B with spouseName="A".
       - If "A is B's brother", infer that A shares B's parents.
    3. **Context Matching**: If a name in the text matches a name in "Current Tree Context" exactly, use that existing name.
    4. **Gender Inference**: 
       - "Wife", "Mother", "Daughter", "Grandma", "Aunt" -> female
       - "Husband", "Father", "Son", "Grandpa", "Uncle" -> male
    5. **Output Structure**: Return a flat array of objects.

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
              description: "Names of parents identified in text"
            },
            spouseName: { type: Type.STRING, description: "Name of spouse identified in text" }
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
