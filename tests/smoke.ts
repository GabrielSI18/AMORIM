import prisma, { seed, resetDb } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { sendAffiliateApprovedEmail, sentEmails } from '@/lib/email'

async function main() {
  resetDb()
  seed('affiliate', [{ name: 'Teste Silva', email: 't@x.com', code: 'TESTE01', status: 'active' }])
  const a = await prisma.affiliate.findUnique({ where: { code: 'TESTE01' } })
  console.log('affiliate:', a?.name, a?.commission_rate)
  console.log('auth:', await auth())
  await sendAffiliateApprovedEmail({ to: 'x@y.com' } as any)
  console.log('emails:', sentEmails.length)
}
main()
