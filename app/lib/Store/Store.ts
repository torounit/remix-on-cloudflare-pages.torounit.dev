export interface Store {
  get: <T>(name: string) => Promise<T | null>;
  set: <T>(name: string, value: T) => Promise<void>;
}
