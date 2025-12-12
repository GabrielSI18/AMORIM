import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasClerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
