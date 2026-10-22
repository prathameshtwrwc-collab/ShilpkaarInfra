import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdmin } from "@/lib/auth";
import { isSameOrigin } from "@/lib/same-origin";
import { MAX_VIDEO_BYTES, storageDriver, VIDEO_TYPES } from "@/lib/storage";

export const runtime = "nodejs";

/** Tells the admin UI whether browser → Blob direct uploads are available. */
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ direct: storageDriver() === "blob" });
}

/**
 * Issues short-lived client tokens so large videos upload straight to Vercel
 * Blob (serverless functions cap request bodies at 4.5 MB). The file is then
 * verified and registered via /api/admin/media/register.
 */
export async function POST(req: Request) {
  if (storageDriver() !== "blob") return NextResponse.json({ error: "Direct uploads are not available." }, { status: 409 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async () => {
        if (!(await getAdmin()) || !isSameOrigin(req)) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [...VIDEO_TYPES],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 31536000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
