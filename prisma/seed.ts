import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is missing in your .env file!");
  console.error("Please add the Supabase URL from Vercel to your .env file and try again.");
  process.exit(1);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords for demo users
  const adminPassword = await hash('GenZ2026!', 10);
  const managerPassword = await hash('Manager2026!', 10);
  const cashierPassword = await hash('Cashier2026!', 10);

  // Create demo users
  console.log('👤 Creating users...');
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@genzrestaurant.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
      {
        email: 'manager@genzrestaurant.com',
        password: managerPassword,
        name: 'Manager User',
        role: 'STAFF',
      },
      {
        email: 'cashier@genzrestaurant.com',
        password: cashierPassword,
        name: 'Cashier User',
        role: 'STAFF',
      },
    ],
    skipDuplicates: true,
  });

  // Create default restaurant
  console.log('🏪 Creating restaurant...');
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'genz-restaurant' },
    update: {
      name: 'Gen-Z Restaurant',
      address: 'Mahipalpur, New Delhi - 110037'
    },
    create: {
      id: 'genz-restaurant',
      name: 'Gen-Z Restaurant',
      address: 'Mahipalpur, New Delhi - 110037',
    },
  });

  // Create tables
  console.log('🪑 Creating tables...');
  await prisma.table.createMany({
    data: [
      { number: 1, capacity: 4, restaurantId: restaurant.id },
      { number: 2, capacity: 2, restaurantId: restaurant.id },
      { number: 3, capacity: 6, restaurantId: restaurant.id },
      { number: 4, capacity: 4, restaurantId: restaurant.id },
      { number: 5, capacity: 8, restaurantId: restaurant.id },
      { number: 6, capacity: 2, restaurantId: restaurant.id },
    ],
    skipDuplicates: true,
  });

  // Create menu items
  console.log('🍽️ Creating menu items...');
  await prisma.menuItem.createMany({
    data: [
      // Starters
      {
        name: 'Veg Spring Roll',
        category: 'Starters',
        price: 180,
        imageUrl: '/images/spring-roll.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Chicken Wings',
        category: 'Starters',
        price: 250,
        imageUrl: '/images/chicken-wings.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Paneer Tikka',
        category: 'Starters',
        price: 220,
        imageUrl: '/images/paneer-tikka.jpg',
        restaurantId: restaurant.id,
      },
      // Main Course
      {
        name: 'Butter Chicken',
        category: 'Main Course',
        price: 350,
        imageUrl: '/images/butter-chicken.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Dal Makhani',
        category: 'Main Course',
        price: 280,
        imageUrl: '/images/dal-makhani.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Paneer Butter Masala',
        category: 'Main Course',
        price: 320,
        imageUrl: '/images/paneer-butter-masala.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Chicken Biryani',
        category: 'Main Course',
        price: 380,
        imageUrl: '/images/chicken-biryani.jpg',
        restaurantId: restaurant.id,
      },
      // Breads
      {
        name: 'Butter Naan',
        category: 'Breads',
        price: 60,
        imageUrl: '/images/butter-naan.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Tandoori Roti',
        category: 'Breads',
        price: 40,
        imageUrl: '/images/tandoori-roti.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Butter Roti',
        category: 'Breads',
        price: 50,
        imageUrl: '/images/butter-roti.jpg',
        restaurantId: restaurant.id,
      },
      // Beverages
      {
        name: 'Coca Cola',
        category: 'Beverages',
        price: 80,
        imageUrl: '/images/coca-cola.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Fresh Lime Soda',
        category: 'Beverages',
        price: 60,
        imageUrl: '/images/fresh-lime-soda.jpg',
        restaurantId: restaurant.id,
      },
      {
        name: 'Mango Lassi',
        category: 'Beverages',
        price: 120,
        imageUrl: '/images/mango-lassi.jpg',
        restaurantId: restaurant.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed!');
  console.log('');
  console.log('📋 Demo Credentials:');
  console.log('  Admin:    admin@genzrestaurant.com / GenZ2026!');
  console.log('  Manager:  manager@genzrestaurant.com / Manager2026!');
  console.log('  Cashier:  cashier@genzrestaurant.com / Cashier2026!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });