import localMemoryService from './localMemoryService.js';

interface SearchResult {
    focusedProduct: any | null;
    relatedProducts: any[];
}

export class ProductSearchEngine {

    /**
     * Finds products based on message content using Code extraction and Text search.
     */
    async findProducts(matricula: string, message: string, productsList?: any[]): Promise<SearchResult> {
        console.log(`[ProductSearchEngine] Searching for: "${message}"${productsList ? ' (in memory list)' : ' (Matricula: ' + matricula + ')'}`);

        let focusedProduct = null;
        let relatedProducts: any[] = [];
        const foundIds = new Set<string>();

        // 1. Code Search (Regex)
        // Matches alphanumeric strings of 3+ chars
        const potentialCodes = message.match(/\b([A-Z0-9]{3,}(?:-[A-Z0-9]+)?)\b/gi);

        if (potentialCodes) {
            for (const potentialCode of potentialCodes) {
                const code = potentialCode.toUpperCase();

                let prod = null;
                if (productsList) {
                    prod = productsList.find(p => p.code?.toUpperCase() === code);
                } else {
                    // Try finding by Exact Code
                    prod = await localMemoryService.getProductByCode(matricula, code);
                }

                if (prod) {
                    console.log(`[ProductSearchEngine] Found by Code: ${prod.name} (${prod.code})`);
                    focusedProduct = prod;
                    foundIds.add(prod.id);
                    break; // Priority to the first valid code found
                }
            }
        }

        // 2. Text Search (RAG-lite)
        // If we didn't find a code, OR if we want to enrich context with related items.

        const cleanMessage = message.replace(/[^\w\s]/gi, '').toLowerCase(); // remove punctuation
        const words = cleanMessage.split(/\s+/).filter(w => w.length > 2); // words > 2 chars

        for (const word of words) {
            // Skip common stopwords (pt-br) - basic list
            if (['que', 'com', 'para', 'tem', 'quero', 'gostaria', 'você', 'voce', 'ola', 'bom', 'dia'].includes(word)) continue;

            let results: any[] = [];
            if (productsList) {
                results = productsList.filter(p =>
                    ((p.name || '').toLowerCase().includes(word) ||
                        (p.description || '').toLowerCase().includes(word) ||
                        (p.code || '').toLowerCase().includes(word)) &&
                    !foundIds.has(p.id)
                );
            } else {
                results = await localMemoryService.searchProducts(matricula, word);
            }

            for (const p of results) {
                if (!foundIds.has(p.id)) {
                    relatedProducts.push(p);
                    foundIds.add(p.id);
                }
            }
        }

        // Limit related items
        relatedProducts = relatedProducts.slice(0, 5);

        console.log(`[ProductSearchEngine] Found ${relatedProducts.length} related products.`);

        return {
            focusedProduct,
            relatedProducts
        };
    }
}

export default new ProductSearchEngine();
