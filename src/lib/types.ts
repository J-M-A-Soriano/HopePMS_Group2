export type Product = {
  id: string;
  name: string;
  category: "Electronics" | "Apparel" | "Home Goods" | "Books" | "Other";
  price: number;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Discontinued";
  createdAt: string;
  imageUrl?: string;
  imageHint?: string;
};
