import { NextResponse } from "next/server";
import https from "node:https";

function fetchPincode(pin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.postalpincode.in/pincode/${pin}`,
      { rejectUnauthorized: false, headers: { Accept: "application/json" } },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => { body += chunk.toString(); });
        res.on("end", () => resolve(body));
      },
    );
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pin: string }> },
) {
  const { pin } = await params;

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const text = await fetchPincode(pin);
    const data = JSON.parse(text);
    const record = Array.isArray(data) ? data[0] : null;
    const offices = Array.isArray(record?.PostOffice) ? record.PostOffice : [];

    if (record?.Status === "Success" && offices.length > 0) {
      const po = offices[0] as Record<string, string>;
      const city = po.District || po.Division || po.Name;
      const state = po.State;
      return NextResponse.json({ city, state });
    }

    return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
