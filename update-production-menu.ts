/**
 * Production Menu Update Script
 * Updates menu items with half/full prices and diet types
 * Run with: npx tsx update-production-menu.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting production menu update...');
  console.log('📍 Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'local');

  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    console.error('❌ Restaurant not found!');
    return;
  }

  console.log(`✅ Found restaurant: ${restaurant.name}`);

  // Menu items with half/full prices and diet types
  const updates = [
    // Tandoor Starters - Veg
    { name: 'Paneer Tikka', priceHalf: 150, price: 280, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Aachari Paneer Tikka', priceHalf: 160, price: 290, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Peri-Peri Paneer Tikka', priceHalf: 170, price: 290, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Malai Paneer Tikka', priceHalf: 190, price: 350, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Afghani Paneer Tikka', priceHalf: 199, price: 360, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Mushroom Tikka', price: 250, dietType: 'VEG', hasHalfFullOption: false },
    
    // Soya Chaap
    { name: 'Tandoori Soya Chaap', priceHalf: 95, price: 190, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Aachari Soya Chaap', priceHalf: 100, price: 199, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Peri-Peri Soya Chaap', priceHalf: 100, price: 199, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Malai Soya Chaap', priceHalf: 130, price: 260, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Afghani Soya Chaap', priceHalf: 135, price: 270, dietType: 'VEG', hasHalfFullOption: true },

    // Tandoor Starters - Non-Veg
    { name: 'Chicken Tikka', priceHalf: 210, price: 390, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Malai Tikka', priceHalf: 240, price: 440, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Aachari Tikka', priceHalf: 220, price: 390, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Afghani Tikka', priceHalf: 270, price: 470, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Tandoori Chicken', priceHalf: 240, price: 440, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Afghani', priceHalf: 260, price: 460, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Sheek Kabab', priceHalf: 120, price: 180, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Fry', priceHalf: 230, price: 420, dietType: 'NON_VEG', hasHalfFullOption: true },

    // Chinese Starters - Veg
    { name: 'Chilli Potato', priceHalf: 120, price: 150, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Honey Chilli Potato', priceHalf: 120, price: 150, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Chilli Paneer', priceHalf: 190, price: 320, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Chilli Mushroom', priceHalf: 190, price: 320, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Veg Manchurian', priceHalf: 150, price: 280, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Paneer 65', priceHalf: 190, price: 320, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Mushroom 65', priceHalf: 190, price: 320, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Paneer Fry', priceHalf: 180, price: 299, dietType: 'VEG', hasHalfFullOption: true },
    { name: 'Mushroom Fry', priceHalf: 180, price: 299, dietType: 'VEG', hasHalfFullOption: true },

    // Chinese Starters - Non-Veg
    { name: 'Chilli Chicken', priceHalf: 220, price: 320, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Honey Chilli Chicken', priceHalf: 220, price: 340, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Manchurian', priceHalf: 220, price: 340, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken 65', priceHalf: 240, price: 360, dietType: 'NON_VEG', hasHalfFullOption: true },
    { name: 'Chicken Lollipop', priceHalf: 240, price: 360, dietType: 'NON_VEG', hasHalfFullOption: true },

    // Biryani - Veg
    { name: 'Veg Biryani', price: 200, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Biryani', price: 220, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Mushroom Biryani', price: 220, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Mix Veg Biryani', price: 220, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'SPL. Soya Chaap Biryani', price: 220, dietType: 'VEG', hasHalfFullOption: false },

    // Biryani - Non-Veg
    { name: 'Egg Biryani', price: 250, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Biryani', price: 290, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Mutton Biryani', price: 350, dietType: 'NON_VEG', hasHalfFullOption: false },

    // Main Course - Non-Veg
    { name: 'Kadhai Chicken', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Tikka Masala', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Kholapuri', price: 390, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Rogan Josh', price: 390, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Rara', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Butter Chicken', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Do-Pyaza', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Curry', price: 400, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Tawa Chicken', price: 420, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Masala', price: 410, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Kabab Masala', price: 350, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Egg Curry', price: 220, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Egg Bhurjee', price: 180, dietType: 'NON_VEG', hasHalfFullOption: false },

    // Mutton
    { name: 'Ghee Roast Mutton', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Mutton Rogan Josh', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Mutton Masala', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Kadhai Mutton', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Mutton Curry', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Handi Mutton', price: 450, dietType: 'NON_VEG', hasHalfFullOption: false },

    // Momos - Veg
    { name: 'Veg Steam Momo', price: 80, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Steam Momo', price: 90, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Veg Fried Momo', price: 120, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Fried Momo', price: 130, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Veg Gravy Momo', price: 90, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Gravy Momo', price: 100, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Veg Tandoori Momo', price: 120, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Tandoori Momo', price: 130, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Veg Kurkure Momo', price: 120, dietType: 'VEG', hasHalfFullOption: false },
    { name: 'Paneer Kurkure Momo', price: 130, dietType: 'VEG', hasHalfFullOption: false },

    // Momos - Non-Veg
    { name: 'Chicken Steam Momo', price: 100, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Fried Momo', price: 140, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Gravy Momo', price: 110, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Tandoori Momo', price: 140, dietType: 'NON_VEG', hasHalfFullOption: false },
    { name: 'Chicken Kurkure Momo', price: 140, dietType: 'NON_VEG', hasHalfFullOption: false },
  ];

  let updated = 0;
  let notFound = 0;

  for (const item of updates) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        name: item.name,
        restaurantId: restaurant.id,
      },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          dietType: item.dietType as any,
          hasHalfFullOption: item.hasHalfFullOption,
          priceHalf: item.priceHalf || null,
          price: item.price,
        },
      });
      updated++;
      console.log(`✅ Updated: ${item.name} - ${item.dietType} ${item.hasHalfFullOption ? '(Half/Full)' : ''}`);
    } else {
      notFound++;
      console.log(`⚠️  Not found: ${item.name}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Updated: ${updated} items`);
  console.log(`   ⚠️  Not found: ${notFound} items`);
  console.log('\n🎉 Production menu update complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
