import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  csrfToken: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCsrfToken(): string {
  return requestContext.getStore()?.csrfToken ?? "";
}
