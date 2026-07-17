import type { PhoenixBrand } from "../types.ts";
import type { PhoenixClient } from "../client.ts";
export class BrandsResource {
  private readonly client: PhoenixClient;
  constructor(client: PhoenixClient) { this.client = client; }
  list(): Promise<PhoenixBrand[]> { return this.client.request("/brands"); }
  get(id: string): Promise<PhoenixBrand> { return this.client.request(`/brands/${encodeURIComponent(id)}`); }
  create(input: Partial<PhoenixBrand>): Promise<PhoenixBrand> { return this.client.request("/brands", { method: "POST", body: input }); }
}


