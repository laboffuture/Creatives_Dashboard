import Papa from 'papaparse';

const BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKNL41XaF6XLt1yhw4jZfZVmwhF6gRgTN1ENAT--kAxzo0a5bfyeZgkxIQYKcOfVDF4CEpiJk0iy2k/pub?single=true&output=csv&gid=";

export const SHEETS = {
  DASHBOARD: '1251562554',
  WEEKLY_REPORT: '328259288',
  MONTHLY_REPORT: '1507872838',
  TEAM_PERFORMANCE: '1909775936',
  TASKS_MASTER: '1768295611',
};

export const MEMBER_GIDS = [
  '526736277', '1553159851', '935237293', '928540504', '1371027157',
  '2083264594', '1268844802', '244189901', '1100057271', '1503083690',
  '679511391', '759419337', '1831427386', '1505321406'
];

export interface MemberSheet {
  gid: string;
  data: string[][];
}

export interface MembersResult {
  members: MemberSheet[];
  /** false if ANY member sheet failed to fetch (so the UI can show an error
   * instead of silently rendering an all-zero dashboard). */
  ok: boolean;
}

/**
 * Fetches a public Google Sheet as CSV and parses it into a 2D string array.
 * Returns { data, ok } so callers can distinguish a real failure from empty data.
 */
async function fetchSheetRaw(gid: string): Promise<{ data: string[][]; ok: boolean }> {
  const url = `${BASE_URL}${gid}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 } // Cache data for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet with GID ${gid}: ${response.statusText}`);
    }

    const csvText = await response.text();

    const parsed = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    return { data: parsed.data, ok: true };
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    return { data: [], ok: false };
  }
}

/**
 * Backwards-compatible helper: returns just the rows (empty array on error).
 * Used by pages that fetch a single tab (e.g. Team Performance).
 */
export async function fetchSheetData(gid: string): Promise<string[][]> {
  return (await fetchSheetRaw(gid)).data;
}

/**
 * Fetches all individual member sheets in parallel and reports whether every
 * fetch succeeded. `ok: false` means at least one sheet could not be loaded.
 */
export async function fetchAllMembersData(): Promise<MembersResult> {
  const results = await Promise.all(
    MEMBER_GIDS.map(async (gid) => {
      const r = await fetchSheetRaw(gid);
      return { gid, data: r.data, ok: r.ok };
    })
  );

  return {
    members: results.map(({ gid, data }) => ({ gid, data })),
    ok: results.every((r) => r.ok),
  };
}
