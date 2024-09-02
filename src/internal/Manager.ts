import { Base } from "./Base";

export class Manager<K extends Base> {
  readonly #cache: K[] = [];

  get length() {
    return this.#cache.length;
  }

  get array() {
    return this.#cache;
  }

  getByIndex(index: number): K | null {
    return this.#cache[index];
  }

  cache(data: K | K[]) {
    if (!Array.isArray(data)) {
      this.#cache.push(data);
      return this.#cache.find((a) => a.id === data.id);
    } else {
      this.#cache.push(...data);
    }
  }

  delete(id: string) {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) this.#cache.splice(index, 1);
  }

  get(id: string): K | undefined {
    return this.#cache.find((a) => a.id === id);
  }

  update(id: string, data: any) {
    const index = this.#cache.findIndex((a) => a.id === id);
    if (index > -1) {
      this.#cache[index]._patch(data);
    }
  }
}
