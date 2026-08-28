import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";
  const delimiter = req.nextUrl.searchParams.get("delimiter") ?? "";

  try {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: "collectra-images",
      Prefix: prefix || undefined,
      Delimiter: delimiter || undefined,
    }));

    const folders = (res.CommonPrefixes ?? []).map(p => p.Prefix?.replace(prefix, "").replace("/", "") ?? "");
    const files = (res.Contents ?? []).map(o => ({ name: o.Key?.replace(prefix, "") ?? "", key: o.Key ?? "" }));

    return NextResponse.json({ folders, files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
