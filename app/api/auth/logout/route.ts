import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  // In a real app, you might want to invalidate the token on the server
  // For now, we'll just return success and let the client clear the token
  return NextResponse.json({ success: true })
}