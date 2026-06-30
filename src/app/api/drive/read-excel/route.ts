import { NextResponse } from "next/server";
import { google } from "googleapis";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  // Require an authenticated session: this endpoint reads file contents using
  // privileged Google credentials and must never be reachable anonymously.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    let auth;
    if (apiKey) {
      auth = apiKey;
    } else {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
    }

    const drive = google.drive({ version: "v3", auth });

    // Fetch the file content
    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    // Parse the Excel file
    const buffer = response.data as ArrayBuffer;
    const workbook = XLSX.read(buffer, { type: "array" });

    // Prefer a sheet named *dashboard* / *report*, else fall back to the first sheet.
    let targetSheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      if (name.toLowerCase().includes("dashboard") || name.toLowerCase().includes("report")) {
        targetSheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[targetSheetName];

    // Convert to 2D array of strings
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    // Stringify all cells just to be safe
    const stringifiedData = data.map(row => row.map(cell => String(cell)));

    return NextResponse.json({ data: stringifiedData });
  } catch (error: any) {
    console.error("Error reading excel file:", error);
    return NextResponse.json(
      { error: "Failed to read Excel file", details: error.message },
      { status: 500 }
    );
  }
}
