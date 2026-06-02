/* eslint-disable preserve-caught-error */
// src/utils/openRouterService.js
import { OpenRouter } from '@openrouter/sdk';

/**
 * Checks if the OpenRouter API key is configured.
 * @returns {boolean}
 */
export const isOpenRouterConfigured = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  return !!(apiKey && apiKey.trim() !== "");
};

/**
 * Calls OpenRouter to parse raw resume text into structured employee details JSON.
 * @param {string} resumeText 
 * @returns {Promise<object>}
 */
export const parseResumeTextWithAI = async (resumeText) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file."
    );
  }

  // Initialize client
  const openRouter = new OpenRouter({
    apiKey: apiKey,
  });

  const prompt = `You are a precise HR data extraction assistant.
Analyze the following resume text and extract the candidate's details.
You MUST return ONLY a valid, single, parseable JSON object matching the following structure. 
Do NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\`), do NOT write any preambles, intros, or explanations, just return the raw JSON object string.

Strict JSON Schema:
{
  "fullName": "First and last name of candidate (e.g. John Doe)",
  "email": "Valid email address (e.g. john.doe@example.com)",
  "phone": "Phone number, preferably in international format (e.g. +971 50 123 4567)",
  "nationality": "Select the closest matching country from this exact list: ['United Arab Emirates', 'India', 'Pakistan', 'United Kingdom', 'United States', 'Philippines']. If it matches another country not listed, use that country's proper name.",
  "address": "Residential address/location (e.g. Downtown Dubai, UAE)",
  "designation": "Extracted or inferred job title / role (e.g. Senior Software Engineer)",
  "department": "Select the closest matching department from this exact list: ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations']",
  "skills": "Comma-separated list of top 5-10 key technical and soft skills",
  "experience": "Estimated experience level (e.g. '8 Years' or '3 Years')",
  "education": "Highest degree obtained (e.g. 'B.Sc. in Computer Science')",
  "joiningDate": "Today's date in YYYY-MM-DD format"
}

Today's Date: ${new Date().toISOString().split('T')[0]}

Candidate Resume Text:
----------------------------------------
${resumeText}
----------------------------------------`;

  try {
    const completion = await openRouter.chat.send({
      chatRequest: {
        model: 'openai/gpt-oss-120b:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }
    });

    const content = completion?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response content received from OpenRouter.");
    }

    // Clean response (strip potential markdown wrapping, if any)
    let cleanJson = content.trim();
    if (cleanJson.startsWith("```")) {
      // Find the first newline after ```
      const firstNewLine = cleanJson.indexOf("\n");
      const lastTickIndex = cleanJson.lastIndexOf("```");
      cleanJson = cleanJson.substring(
        firstNewLine !== -1 ? firstNewLine + 1 : 3,
        lastTickIndex !== -1 ? lastTickIndex : cleanJson.length
      ).trim();
    }

    try {
      const parsedData = JSON.parse(cleanJson);
      
      // Ensure all fields exist in the returned object, default to empty string if missing
      const requiredFields = [
        "fullName", "email", "phone", "nationality", "address",
        "designation", "department", "skills", "experience", "education", "joiningDate"
      ];
      
      const sanitizedData = {};
      requiredFields.forEach(field => {
        sanitizedData[field] = parsedData[field] || "";
      });
      
      return sanitizedData;
    // eslint-disable-next-line no-unused-vars
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON. Raw response was:", content);
      throw new Error("The AI response could not be parsed as structured JSON. Please try again.");
    }

  } catch (error) {
    console.error("OpenRouter API Error:", error);
    throw new Error(error.message || "Failed to communicate with OpenRouter API.");
  }
};
