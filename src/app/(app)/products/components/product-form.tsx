"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2 } from "lucide-react";
import { generateDescriptionAction } from "../actions";
import { useState } from "react";
import type { Product } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  category: z.enum([
    "Electronics",
    "Apparel",
    "Home Goods",
    "Books",
    "Other",
  ]),
  price: z.coerce.number().positive("Price must be a positive number."),
  stock: z.coerce.number().int().min(0, "Stock can't be negative."),
  description: z.string().optional(),
  keywords: z.string().optional(),
  briefInput: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: Product;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
        }
      : {
          name: "",
          category: "Electronics",
          price: 0,
          stock: 0,
          description: "",
          keywords: "",
          briefInput: "",
        },
  });

  const { isSubmitting } = form.formState;

  // M3 (DB Specialist) Logic:
  // When this form is submitted, the data should be sent to a server action
  // that will insert/update the product in the Supabase database.
  function onSubmit(values: ProductFormValues) {
    console.log(values);
    toast({
      title: "Product Submitted",
      description: "Product data is ready to be saved.",
    });
    // In a real scenario, you would call `saveProductAction(values)` here.
  }
  
  // Watch fields needed for AI generation
  const category = useWatch({ control: form.control, name: "category" });
  const briefInput = useWatch({ control: form.control, name: "briefInput" });
  const keywords = useWatch({ control: form.control, name: "keywords" });


  async function handleGenerateDescription() {
    setIsGenerating(true);
    // M2 (Frontend Specialist) Logic:
    // This function calls the server action for AI description generation.
    // It constructs FormData and sets loading states.
    const formData = new FormData();
    formData.append("category", category);
    formData.append("briefInput", briefInput || form.getValues("name"));
    formData.append("keywords", keywords || "");
    
    const result = await generateDescriptionAction({}, formData);
    
    if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({
            title: "Success",
            description: "AI-generated description has been added.",
        })
    } else {
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: result.message,
        })
    }
    
    setIsGenerating(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Wireless Headphones" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your product..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Description Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="briefInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Core Features / Brief</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20-hour battery, Bluetooth 5.2" {...field} />
                      </FormControl>
                       <FormDescription>
                        Provide core features or a brief for the AI. Uses product name if empty.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. portable, durable, lightweight" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords to guide the AI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
              </CardContent>
            </Card>

          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Electronics">
                            Electronics
                          </SelectItem>
                          <SelectItem value="Apparel">Apparel</SelectItem>
                          <SelectItem value="Home Goods">Home Goods</SelectItem>
                          <SelectItem value="Books">Books</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="99.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save Changes" : "Add Product"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
