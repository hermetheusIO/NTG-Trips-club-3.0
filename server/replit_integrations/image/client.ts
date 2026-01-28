import { GoogleGenAI, Modality } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.
export const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Replit AI Integrations.
 */
export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

const NTG_BRANDING_TEMPLATE = `Style: Premium dark travel photography with gold accents.
Visual Elements:
- Dark, moody atmospheric lighting with warm gold highlights
- Rich contrast between shadows and highlights
- Subtle golden hour or twilight ambiance
- Professional travel photography aesthetic
- Clean composition suitable for a trip cover image

Format: Wide landscape format (16:9 aspect ratio), high quality, photorealistic.
Brand: NonTourist Guide - authentic Portuguese experiences from Coimbra.

Content:`;

/**
 * Generate a high-quality trip cover image with NTG Trips branding.
 * Uses gemini-3-pro-image-preview (Nano Banana Pro) for premium quality.
 */
export async function generateTripCoverImage(
  coverPrompt: string,
  tripTitle: string,
  destinations: string[]
): Promise<{ base64: string; mimeType: string }> {
  const brandedPrompt = `${NTG_BRANDING_TEMPLATE}
Trip: "${tripTitle}"
Destinations: ${destinations.join(", ")}
Scene description: ${coverPrompt}

Create a stunning, atmospheric cover image that captures the essence of this day trip from Coimbra, Portugal. Focus on the destination's unique character with premium dark aesthetic and subtle golden accents.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ role: "user", parts: [{ text: brandedPrompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response from Nano Banana Pro");
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

