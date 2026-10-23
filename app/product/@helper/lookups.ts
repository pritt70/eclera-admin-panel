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
  if (!forceRefresh && cachedCategories !== null && cachedCollections !== null) {
    return { categories: cachedCategories, collections: cachedCollections };
  }

  if (lookupsPromise && !forceRefresh) {
    return lookupsPromise;
  }

  lookupsPromise = (async (): Promise<ProductLookups> => {
    try {
      const [catRes, colRes] = await Promise.all([
        api("category/list", { status: "active", limit: 200 }),
        api("collection/list", { status: "active", limit: 200 }),
      ]);

      const cats: any[] =
        catRes && catRes.status && Array.isArray(catRes.data?.categories)
          ? catRes.data.categories
          : [];
      const cols: any[] =
        colRes && colRes.status && Array.isArray(colRes.data?.collections)
          ? colRes.data.collections
          : [];

      cachedCategories = cats;
      cachedCollections = cols;

      return { categories: cats, collections: cols };
    } catch (e) {
      console.error("Failed to load product lookups:", e);
      return {
        categories: cachedCategories || [],
        collections: cachedCollections || [],
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
