import type { Product } from "@/lib/types";

export const mockProducts: Product[] = [
  {
    id: "PROD-001",
    name: "Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    price: 349.99,
    stock: 150,
    status: "In Stock",
    createdAt: "2023-10-26T10:00:00Z",
    imageUrl: "https://picsum.photos/seed/1/600/400",
    imageHint: "wireless headphones"
  },
  {
    id: "PROD-002",
    name: "Ultra-Slim Laptop 14-inch",
    category: "Electronics",
    price: 1299.0,
    stock: 75,
    status: "In Stock",
    createdAt: "2023-10-25T14:30:00Z",
    imageUrl: "https://picsum.photos/seed/2/600/400",
    imageHint: "modern laptop"
  },
  {
    id: "PROD-003",
    name: "Smart Fitness Watch",
    category: "Electronics",
    price: 199.5,
    stock: 200,
    status: "In Stock",
    createdAt: "2023-10-24T09:00:00Z",
    imageUrl: "https://picsum.photos/seed/3/600/400",
    imageHint: "smart watch"
  },
  {
    id: "PROD-004",
    name: "Organic Cotton T-Shirt",
    category: "Apparel",
    price: 25.0,
    stock: 0,
    status: "Out of Stock",
    createdAt: "2023-10-22T11:45:00Z",
  },
  {
    id: "PROD-005",
    name: "Modern Ergonomic Office Chair",
    category: "Home Goods",
    price: 450.0,
    stock: 40,
    status: "In Stock",
    createdAt: "2023-10-20T16:20:00Z",
    imageUrl: "https://picsum.photos/seed/5/600/400",
    imageHint: "office chair"
  },
  {
    id: "PROD-006",
    name: "The Art of Programming",
    category: "Books",
    price: 45.99,
    stock: 120,
    status: "In Stock",
    createdAt: "2023-10-18T12:00:00Z",
  },
  {
    id: "PROD-007",
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 89.99,
    stock: 5,
    status: "Discontinued",
    createdAt: "2023-01-15T18:00:00Z",
    imageUrl: "https://picsum.photos/seed/6/600/400",
    imageHint: "bluetooth speaker"
  },
  {
    id: "PROD-008",
    name: "Minimalist Leather Backpack",
    category: "Apparel",
    price: 150.0,
    stock: 60,
    status: "In Stock",
    createdAt: "2023-10-10T10:10:00Z",
    imageUrl: "https://picsum.photos/seed/8/600/400",
    imageHint: "minimalist backpack"
  },
];
