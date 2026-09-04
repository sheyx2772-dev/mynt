import type { ClickRequest } from "./click";

// Click posts form-encoded bodies, but sends JSON in some integrations and
// during testing. Accept either and normalise to strings, since every signed
// field is concatenated as text.
export async function readClickBody(request: Request): Promise<ClickRequest> {
  const contentType = request.headers.get("content-type") ?? "";
  const raw: Record<string, unknown> = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());

  const str = (key: string) => (raw[key] === undefined ? "" : String(raw[key]));

  return {
    click_trans_id: str("click_trans_id"),
    service_id: str("service_id"),
    merchant_trans_id: str("merchant_trans_id"),
    merchant_prepare_id: raw.merchant_prepare_id === undefined ? undefined : str("merchant_prepare_id"),
    amount: str("amount"),
    action: str("action"),
    sign_time: str("sign_time"),
    sign_string: str("sign_string"),
    error: raw.error === undefined ? undefined : str("error"),
  };
}
