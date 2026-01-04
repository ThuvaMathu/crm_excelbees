
export class BatchRequestManager {
  /**
   * Processes a list of items with the given async handler, enforcing a concurrency limit.
   * Useful for bulk operations (e.g. generating 10 email variations, analyzing 5 competitors).
   * 
   * @param items Array of data items to process
   * @param handler Async function that processes one item
   * @param concurrency Max parallel requests (default 3)
   */
  static async processBatch<T, R>(
    items: T[], 
    handler: (item: T, index: number) => Promise<R>, 
    concurrency: number = 3
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    const queue = items.map((item, index) => ({ item, index }));
    const workers = new Array(concurrency).fill(null).map(async () => {
       while(queue.length > 0) {
           const { item, index } = queue.shift()!;
           try {
               results[index] = await handler(item, index);
           } catch (e) {
               console.error(`[BatchManager] Item ${index} failed`, e);
               // We could implement retry logic here
               results[index] = null as any; 
           }
       }
    });

    await Promise.all(workers);
    return results;
  }
}
