'use server';
/**
 * @fileOverview A generative AI tool to assist in drafting product descriptions.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - ProductDescriptionGenerationInput - The input type for the generateProductDescription function.
 * - ProductDescriptionGenerationOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDescriptionGenerationInputSchema = z.object({
  keywords: z
    .array(z.string())
    .describe('A list of keywords relevant to the product. (e.g., "portable", "wireless", "noise-cancelling")'),
  category: z
    .string()
    .describe('The category of the product. (e.g., "Electronics", "Home Goods", "Apparel")'),
  briefInput: z
    .string()
    .describe('A brief input or core features of the product to guide the description generation.'),
});
export type ProductDescriptionGenerationInput = z.infer<
  typeof ProductDescriptionGenerationInputSchema
>;

const ProductDescriptionGenerationOutputSchema = z.object({
  description: z.string().describe('The generated compelling product description.'),
});
export type ProductDescriptionGenerationOutput = z.infer<
  typeof ProductDescriptionGenerationOutputSchema
>;

export async function generateProductDescription(
  input: ProductDescriptionGenerationInput
): Promise<ProductDescriptionGenerationOutput> {
  return aiProductDescriptionGenerationFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: ProductDescriptionGenerationInputSchema},
  output: {schema: ProductDescriptionGenerationOutputSchema},
  prompt: `You are an expert marketing copywriter.
Your goal is to create a compelling and engaging product description based on the provided information.

Instructions:
- Write a product description that is engaging and highlights the product's benefits.
- Incorporate the provided keywords naturally into the description.
- Focus on the key features and selling points from the brief input.
- The description should be suitable for a product listing.

Product Category: {{{category}}}
Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Brief Input/Core Features: {{{briefInput}}}`,
});

const aiProductDescriptionGenerationFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionGenerationFlow',
    inputSchema: ProductDescriptionGenerationInputSchema,
    outputSchema: ProductDescriptionGenerationOutputSchema,
  },
  async input => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);
