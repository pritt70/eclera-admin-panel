import { api } from "@/helper";

export interface ProductLookups {
  categories: any[];
  collections: any[];
}

// Module-level cache so opening dialogs does not re-fetch category/list & collection/list repeatedly
let cachedCategories: any[] | null = null;
let cachedCollections: any[] | null = null;
let lookupsPromise: Promise<ProductLookups> | null = null;

export async function getProductLookups(forceRefresh = false): Promise<ProductLookups> {
  if (!forceRefresh && cachedCategories !== null) {
    return { categories: cachedCategories, collections: [] };
  }

  if (lookupsPromise && !forceRefresh) {
    return lookupsPromise;
  }

  lookupsPromise = (async (): Promise<ProductLookups> => {
    try {
      const catRes = await api("category/list", { status: "active", limit: 200 });

      const cats: any[] =
        catRes && catRes.status && Array.isArray(catRes.data?.categories)
          ? catRes.data.categories
          : [];

      cachedCategories = cats;

      return { categories: cats, collections: [] };
    } catch (e) {
      console.error("Failed to load product lookups:", e);
      return {
        categories: cachedCategories || [],
        collections: [],
      };
    } finally {
      lookupsPromise = null;
    }
  })();

  return await lookupsPromise;
}

export function invalidateProductLookups() {
  cachedCategories = null;
  cachedCollections = null;
  lookupsPromise = null;
}
