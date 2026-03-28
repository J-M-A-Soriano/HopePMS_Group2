"use server";

import { generateProductDescription } from "@/ai/flows/ai-product-description-generation";
import { z } from "zod";

const aiDescriptionSchema = z.object({
  keywords: z.string().optional(),
  category: z.string(),
  briefInput: z.string(),
});

export async function generateDescriptionAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = aiDescriptionSchema.safeParse({
    keywords: formData.get("keywords"),
    category: formData.get("category"),
    briefInput: formData.get("briefInput"),
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid fields for AI generation.",
    };
  }

  try {
    const { keywords, category, briefInput } = validatedFields.data;
    const keywordList = keywords ? keywords.split(",").map((k) => k.trim()) : [];

    const result = await generateProductDescription({
      keywords: keywordList,
      category,
      briefInput,
    });

    return { description: result.description, message: "Description generated." };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to generate description.",
    };
  }
}

// M3 (DB Specialist) Logic:
// The action to save a product to the database would go here.
// It would receive the form data, validate it, and then perform an
// `insert` or `update` operation with Supabase.
// For example:
/*
export async function saveProductAction(formData: FormData) {
  const supabase = createClient();
  const rawData = {
    name: formData.get('name'),
    ...
  }
  // Zod validation here...
  const { error } = await supabase.from('products').insert(validatedData);

  if (error) {
    // handle error
  }
  revalidatePath('/products');
  redirect('/products');
}
*/
