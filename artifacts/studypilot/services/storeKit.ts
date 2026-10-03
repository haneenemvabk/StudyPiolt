export type StoreKitProductId = 'studypilot_pro_monthly' | 'studypilot_pro_yearly';

export type StoreKitProduct = {
  id: StoreKitProductId;
  displayName: string;
  price: string;
  period: 'month' | 'year';
};

export type StoreKitEntitlement = {
  active: boolean;
  productId?: StoreKitProductId;
  source: 'mock-storekit' | 'app-store';
};

export interface StoreKitProvider {
  getProducts(): Promise<StoreKitProduct[]>;
  purchase(productId: StoreKitProductId): Promise<StoreKitEntitlement>;
  restorePurchases(): Promise<StoreKitEntitlement>;
}

export const STOREKIT_PRODUCTS: StoreKitProduct[] = [
  { id: 'studypilot_pro_monthly', displayName: 'Pro Monthly', price: '$4.99', period: 'month' },
  { id: 'studypilot_pro_yearly', displayName: 'Pro Yearly', price: '$39.99', period: 'year' },
];

/**
 * StoreKit seam for the Expo Go/reviewer build.
 * Replace this provider with the native StoreKit 2 adapter when products are
 * created in App Store Connect. The UI and entitlement model stay unchanged.
 */
export class MockStoreKitProvider implements StoreKitProvider {
  async getProducts() {
    return STOREKIT_PRODUCTS;
  }

  async purchase(productId: StoreKitProductId): Promise<StoreKitEntitlement> {
    return { active: true, productId, source: 'mock-storekit' };
  }

  async restorePurchases(): Promise<StoreKitEntitlement> {
    return { active: false, source: 'mock-storekit' };
  }
}

export const storeKit = new MockStoreKitProvider();