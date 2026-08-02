export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  inStock: boolean;
}

export const MOCK_PRODUCTS: Record<string, MockProduct> = {
  tshirt: {
    id: 'prod_001',
    sku: 'TSHIRT-BLK-M',
    name: 'Classic Black T-Shirt',
    price: 89.99,
    currency: 'PLN',
    inStock: true,
  },
  hoodie: {
    id: 'prod_002',
    sku: 'HOODIE-GRY-L',
    name: 'Premium Grey Hoodie',
    price: 209.99,
    currency: 'PLN',
    inStock: true,
  },
};
