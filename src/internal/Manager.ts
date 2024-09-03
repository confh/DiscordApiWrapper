import { Base } from "./Base";

/**
 * Manages a cache of objects that extend the Base class.
 */
export class Manager<K extends Base> {
  readonly #cache: K[] = [];

  get length(): number {
    return this.#cache.length;
  }

  get array(): K[] {
    return this.#cache;
  }

  /**
   * Gets the item at the specified index.
   * @param index The index of the item to get.
   * @returns The item at the specified index, or null if the index is out of bounds.
   */
  getByIndex(index: number): K | null {
    return this.#cache[index];
  }

  /**
   * Adds a new item to the cache or multiple items if an array is provided.
   * @param data The item(s) to add to the cache.
   * @returns The added item.
   */
  cache(data: K | K[]): K {
    if (!Array.isArray(data)) {
      this.#cache.push(data);
      return this.#cache.find((a) => a.id === data.id);
    } else {
      this.#cache.push(...data);
    }
  }

  /**
   * Removes the item with the specified ID from the cache.
   * @param id The ID of the item to remove.
   */
  delete(id: string): void {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) this.#cache.splice(index, 1);
  }

  /**
   * Gets the item with the specified ID from the cache.
   * @param id The ID of the item to get.
   * @returns The item with the specified ID, or undefined if the item is not found.
   */
  get(id: string): K | undefined {
    return this.#cache.find((a) => a.id === id);
  }

  /**
   * Updates the item with the specified ID in the cache.
   * @param id The ID of the item to update.
   * @param data The data to update the item with.
   */
  update(id: string, data: any): void {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) {
      this.#cache[index]._patch(data);
    }
  }
}
