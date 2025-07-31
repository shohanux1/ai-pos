import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export interface AuthenticatedRequest extends NextRequest {
  userId?: string
  userRole?: string
}

export async function authenticate(req: NextRequest): Promise<{ userId?: string, userRole?: string, error?: NextResponse }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user || !user.isActive) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    
    return { userId: user.id, userRole: user.role }
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}