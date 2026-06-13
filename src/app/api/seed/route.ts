import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    const adminPassword = await hash('GenZ2026!', 12);
    const managerPassword = await hash('Manager2026!', 12);
    const cashierPassword = await hash('Cashier2026!', 12);

    await prisma.user.createMany({
      data: [
        { name: 'Admin User', email: 'admin@genzrestaurant.com', password: adminPassword, role: 'ADMIN' },
        { name: 'Restaurant Manager', email: 'manager@genzrestaurant.com', password: managerPassword, role: 'STAFF' },
        { name: 'Cashier Staff', email: 'cashier@genzrestaurant.com', password: cashierPassword, role: 'STAFF' },
      ],
      skipDuplicates: true,
    });

    // Create default restaurant
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

    // Seed tables
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

    // Seed Menu Items
    const items = [
      { name: 'Veg Spring Roll', price: 180, category: 'Starters', imageUrl: '/images/spring-roll.jpg', restaurantId: restaurant.id },
      { name: 'Chicken Wings', price: 250, category: 'Starters', imageUrl: '/images/chicken-wings.jpg', restaurantId: restaurant.id },
      { name: 'Butter Chicken', price: 350, category: 'Main Course', imageUrl: '/images/butter-chicken.jpg', restaurantId: restaurant.id },
      { name: 'Dal Makhani', price: 280, category: 'Main Course', imageUrl: '/images/dal-makhani.jpg', restaurantId: restaurant.id },
      { name: 'Butter Naan', price: 60, category: 'Breads', imageUrl: '/images/butter-naan.jpg', restaurantId: restaurant.id },
      { name: 'Coca Cola', price: 80, category: 'Beverages', imageUrl: '/images/coca-cola.jpg', restaurantId: restaurant.id },
    ];

    await prisma.menuItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: 'Database seeded successfully. You can now login!' });
  } catch (error) {
    console.error('Seeding failed', error);
    return NextResponse.json({ error: 'Failed to seed DB', details: error }, { status: 500 });
  }
}
