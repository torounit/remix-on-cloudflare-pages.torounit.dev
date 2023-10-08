import type { Store } from "./Store";
import type { KVNamespacePutOptions } from "@cloudflare/workers-types";

export default class KVStore implements Store {
  private KV: KVNamespace;
  private options: KVNamespacePutOptions;

  constructor(
    KV: KVNamespace,
    options: KVNamespacePutOptions = { expirationTtl: 60},
  ) {
    this.KV = KV;
    this.options = options;
  }

  async get<T>(name: string) {
    return await this.KV.get<T>(name, "json");
  }

  async set<T>(name: string, value: T) {
    await this.KV.put(name, JSON.stringify(value), this.options);
  }
}
