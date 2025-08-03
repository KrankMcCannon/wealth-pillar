
// import { GoogleGenAI, Type } from "@google/genai";
// import { Category } from '../types';

// if (!process.env.API_KEY) {
//   console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
// }

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// export const getCategorySuggestion = async (description: string, categories: Category[]): Promise<Category | null> => {
//   if (!process.env.API_KEY) {
//     return null;
//   }
  
//   try {
//     const prompt = `Based on the transaction description "${description}", which of the following categories is the most appropriate?

//     Categories: ${categories.join(', ')}

//     Return ONLY the category name that fits best.`;

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: prompt,
//         config: {
//           responseMimeType: "application/json",
//           responseSchema: {
//             type: Type.OBJECT,
//             properties: {
//               category: {
//                 type: Type.STRING,
//                 description: 'The suggested category.',
//                 enum: categories,
//               }
//             }
//           }
//         }
//     });
    
//     const jsonStr = response.text.trim();
//     if(jsonStr) {
//       const result = JSON.parse(jsonStr);
//       if (result.category && categories.includes(result.category as Category)) {
//         return result.category as Category;
//       }
//     }
//     return null;
//   } catch (error) {
//     console.error("Error getting category suggestion from Gemini:", error);
//     return null;
//   }
// };
