import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth-utils'

// Middleware to check authentication
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  return user
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticate(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, role, is_active } = body

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(is_active !== undefined && { isActive: is_active }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      is_active: updatedUser.isActive,
      last_login: updatedUser.lastLogin,
      created_at: updatedUser.createdAt,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticate(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Prevent deleting self
    if (user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}