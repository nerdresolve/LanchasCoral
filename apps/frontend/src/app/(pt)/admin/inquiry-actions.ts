'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function markHandled(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return

  const inquiry = await prisma.inquiry.findUnique({ where: { id } })
  if (!inquiry) return

  await prisma.inquiry.update({ where: { id }, data: { handled: !inquiry.handled } })
  revalidatePath('/admin/inquiries')
}
