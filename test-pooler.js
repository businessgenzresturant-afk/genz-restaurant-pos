const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.hgnybmsltqpmiaymabvq:zYtvi7-rebdex-gokbix@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Success! Pooler connected.", users.length);
  } catch (e) {
    console.error("Pooler failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
