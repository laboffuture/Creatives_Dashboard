import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  // Require an authenticated session. The proxy/middleware does NOT cover
  // /api routes, so this guard is the only thing protecting this endpoint.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json(
        { error: "GOOGLE_SCRIPT_URL is not configured in .env.local" },
        { status: 500 }
      );
    }

    // Call the Google Apps Script Web App
    const response = await fetch(scriptUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Ensure we only show Excel backup files, ignoring images/PDFs that might accidentally be in the folder
    const excelFiles = (data.files || []).filter((f: any) =>
      f.name.toLowerCase().endsWith('.xlsx') ||
      f.mimeType.includes('spreadsheet') ||
      f.mimeType.includes('excel')
    );

    return NextResponse.json({ files: excelFiles });
  } catch (error: any) {
    console.error("Error fetching drive files from Apps Script:", error);
    return NextResponse.json(
      { error: "Failed to fetch files from Google Drive", details: error.message },
      { status: 500 }
    );
  }
}
