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
   * Gets the element at the specified index.
   * @param index The index of the element to get.
   * @returns The element at the specified index, or null if the index is out of bounds.
   */
  getByIndex(index: number): K | null {
    return this.#cache[index];
  }

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   *
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the cache.
   */
  filter(predicate: (value: K, index: number) => boolean): K[] {
    return this.#cache.filter(predicate);
  }

  /**
   * Adds a new element to the cache or multiple elements if an array is provided.
   * @param data The element(s) to add to the cache.
   * @returns The added element.
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
   * Removes the element with the specified ID from the cache.
   * @param id The ID of the element to remove.
   */
  delete(id: string): void {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) this.#cache.splice(index, 1);
  }

  /**
   * Gets the element with the specified ID from the cache.
   * @param id The ID of the element to get.
   * @returns The element with the specified ID, or undefined if the element is not found.
   */
  get(id: string): K | undefined {
    return this.#cache.find((a) => a.id === id);
  }

  /**
   * Updates the element with the specified ID in the cache.
   * @param id The ID of the element to update.
   * @param data The data to update the element with.
   */
  update(id: string, data: any): void {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) {
      this.#cache[index]._patch(data);
    }
  }
}
