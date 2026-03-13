import { PRODUCT_NAME, ORG_NAME } from "../config.ts";

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function ctaButton(url: string, label: string): string {
  return `<p style="margin:0 0 16px;">
  <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 20px;background:#2A65AE;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
    ${escapeHtml(label)}
  </a>
</p>`;
}

export function baseEmailHtml(params: {
  subtitle: string;
  bodyHtml: string;
}): string {
  const { subtitle, bodyHtml } = params;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafd;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#2A65AE;color:#ffffff;padding:18px 24px;">
                <h1 style="margin:0;font-size:20px;line-height:1.2;">${escapeHtml(PRODUCT_NAME)}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">${escapeHtml(subtitle)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;background:#f1f5f9;color:#94a3b8;font-size:12px;">
                Automated email from ${escapeHtml(PRODUCT_NAME)} &mdash; ${escapeHtml(ORG_NAME)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
