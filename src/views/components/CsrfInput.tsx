import type { FC } from "hono/jsx";
import { getCsrfToken } from "../../lib/request-context.ts";

export const CsrfInput: FC = () => {
  const token = getCsrfToken();
  return <input type="hidden" name="_csrf" value={token} />;
};
