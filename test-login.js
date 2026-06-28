// Test login directly with database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🧪 Testing Login...\n');
  
  const email = 'business.genzresturant@gmail.com';
  const password = 'Admin@123';
  
  console.log('1. Fetching user from database...');
  const user = await prisma.user.findUnique({ 
    where: { email } 
  });
  
  if (!user) {
    console.log('❌ User not found!');
    return;
  }
  
  console.log('✅ User found:', {
    email: user.email,
    name: user.name,
    role: user.role,
    passwordLength: user.password.length
  });
  
  console.log('\n2. Testing password...');
  const isValid = await bcrypt.compare(password, user.password);
  
  if (isValid) {
    console.log('✅ Password is CORRECT!');
    console.log('\n✅ Login should work!');
    console.log('\n📝 Use these credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } else {
    console.log('❌ Password is WRONG!');
    console.log('\n🔧 Fixing password...');
    
    const newHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: newHash }
    });
    
    console.log('✅ Password fixed! Try again.');
  }
  
  await prisma.$disconnect();
}

testLogin().catch(console.error);
