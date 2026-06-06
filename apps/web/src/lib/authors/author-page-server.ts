import { resolveAuthorPage } from "./author-page";
import { getAuthorService } from "./server";

export async function resolveAuthorPageFromDatabase(addressParam: string) {
  return resolveAuthorPage(addressParam, async (address) => {
    const service = await getAuthorService();
    return service.getAuthorByAddress(address);
  });
}
