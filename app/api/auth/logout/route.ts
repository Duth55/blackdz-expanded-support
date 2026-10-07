import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { siteUrl } from "@/lib/config";

export async function GET() {
  await clearSession();
  return NextResponse.redirect(siteUrl());
}
