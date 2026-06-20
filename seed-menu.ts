import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuItemsData = [
  // Tandoor Starter (Veg)
  { name: 'Paneer Tikka', category: 'Tandoor Starter (Veg)', priceHalf: 150, price: 280, dietType: 'VEG' },
  { name: 'Aachari Paneer Tikka', category: 'Tandoor Starter (Veg)', priceHalf: 160, price: 290, dietType: 'VEG' },
  { name: 'Peri-Peri Paneer Tikka', category: 'Tandoor Starter (Veg)', priceHalf: 170, price: 290, dietType: 'VEG' },
  { name: 'Malai Paneer Tikka', category: 'Tandoor Starter (Veg)', priceHalf: 190, price: 350, dietType: 'VEG' },
  { name: 'Afghani Paneer Tikka', category: 'Tandoor Starter (Veg)', priceHalf: 199, price: 360, dietType: 'VEG' },
  { name: 'Mushroom Tikka', category: 'Tandoor Starter (Veg)', priceHalf: null, price: 250, dietType: 'VEG' },

  // Soya Chaap
  { name: 'Tandoori Soya Chaap', category: 'Soya Chaap', priceHalf: 190, price: 390, dietType: 'VEG' },
  { name: 'Aachari Soya Chaap', category: 'Soya Chaap', priceHalf: 199, price: 440, dietType: 'VEG' },
  { name: 'Peri-Peri Soya Chaap', category: 'Soya Chaap', priceHalf: 199, price: 390, dietType: 'VEG' },
  { name: 'Malai Soya Chaap', category: 'Soya Chaap', priceHalf: 260, price: 470, dietType: 'VEG' },
  { name: 'Afghani Soya Chaap', category: 'Soya Chaap', priceHalf: 270, price: 440, dietType: 'VEG' },

  // Tandoor Starter (Non-Veg)
  { name: 'Chicken Tikka', category: 'Tandoor Starter (Non-Veg)', priceHalf: 210, price: 390, dietType: 'NON_VEG' },
  { name: 'Chicken Malai Tikka', category: 'Tandoor Starter (Non-Veg)', priceHalf: 240, price: 440, dietType: 'NON_VEG' },
  { name: 'Chicken Aachari Tikka', category: 'Tandoor Starter (Non-Veg)', priceHalf: 220, price: 390, dietType: 'NON_VEG' },
  { name: 'Chicken Afghani Tikka', category: 'Tandoor Starter (Non-Veg)', priceHalf: 270, price: 470, dietType: 'NON_VEG' },
  { name: 'Tandoori Chicken', category: 'Tandoor Starter (Non-Veg)', priceHalf: 240, price: 440, dietType: 'NON_VEG' },
  { name: 'Chicken Afghani', category: 'Tandoor Starter (Non-Veg)', priceHalf: 260, price: 460, dietType: 'NON_VEG' },
  { name: 'Chicken Sheekh Kabab', category: 'Tandoor Starter (Non-Veg)', priceHalf: 120, price: 180, dietType: 'NON_VEG' },
  { name: 'Chicken Fry', category: 'Tandoor Starter (Non-Veg)', priceHalf: 230, price: 420, dietType: 'NON_VEG' },

  // Chinese Starter (Veg)
  { name: 'Chilli Potato', category: 'Chinese Starter (Veg)', priceHalf: 120, price: 150, dietType: 'VEG' },
  { name: 'Honey Chilli Potato', category: 'Chinese Starter (Veg)', priceHalf: 120, price: 150, dietType: 'VEG' },
  { name: 'Chilli Paneer', category: 'Chinese Starter (Veg)', priceHalf: 190, price: 320, dietType: 'VEG' },
  { name: 'Chilli Mushroom', category: 'Chinese Starter (Veg)', priceHalf: 190, price: 320, dietType: 'VEG' },
  { name: 'Veg Manchurian', category: 'Chinese Starter (Veg)', priceHalf: 150, price: 280, dietType: 'VEG' },
  { name: 'Paneer 65', category: 'Chinese Starter (Veg)', priceHalf: 190, price: 320, dietType: 'VEG' },
  { name: 'Mushroom 65', category: 'Chinese Starter (Veg)', priceHalf: 190, price: 320, dietType: 'VEG' },
  { name: 'Paneer Fry', category: 'Chinese Starter (Veg)', priceHalf: 180, price: 299, dietType: 'VEG' },
  { name: 'Mushroom Fry', category: 'Chinese Starter (Veg)', priceHalf: 180, price: 299, dietType: 'VEG' },

  // Chinese Starter (Non-Veg)
  { name: 'Chilli Chicken', category: 'Chinese Starter (Non-Veg)', priceHalf: 220, price: 320, dietType: 'NON_VEG' },
  { name: 'Honey Chilli Chicken', category: 'Chinese Starter (Non-Veg)', priceHalf: 220, price: 340, dietType: 'NON_VEG' },
  { name: 'Chicken Manchurian', category: 'Chinese Starter (Non-Veg)', priceHalf: 220, price: 340, dietType: 'NON_VEG' },
  { name: 'Chicken 65', category: 'Chinese Starter (Non-Veg)', priceHalf: 240, price: 360, dietType: 'NON_VEG' },
  { name: 'Chicken Lollipop', category: 'Chinese Starter (Non-Veg)', priceHalf: 240, price: 360, dietType: 'NON_VEG' },

  // Noodles
  { name: 'Veg Noodle', category: 'Noodles', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Schezwan Noodle', category: 'Noodles', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Paneer Noodle', category: 'Noodles', priceHalf: 140, price: 170, dietType: 'VEG' },
  { name: 'Chilli Garlic Noodle', category: 'Noodles', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Hakka Noodle', category: 'Noodles', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Singapore Noodle', category: 'Noodles', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Chicken Noodle', category: 'Noodles', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chicken Schezwan Noodle', category: 'Noodles', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chicken Hakka Noodle', category: 'Noodles', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chilli Chicken Garlic Noodle', category: 'Noodles', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chicken Singapore Noodle', category: 'Noodles', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Egg Noodle', category: 'Noodles', priceHalf: 130, price: 170, dietType: 'NON_VEG' },

  // Fried Rice
  { name: 'Veg Fried Rice', category: 'Fried Rice', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Chilli Garlic Fried Rice', category: 'Fried Rice', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Schezwan Fried Rice', category: 'Fried Rice', priceHalf: 120, price: 160, dietType: 'VEG' },
  { name: 'Paneer Fried Rice', category: 'Fried Rice', priceHalf: 140, price: 180, dietType: 'VEG' },
  { name: 'Mushroom Fried Rice', category: 'Fried Rice', priceHalf: 140, price: 180, dietType: 'VEG' },
  { name: 'Chicken Fried Rice', category: 'Fried Rice', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chilli Chicken Garlic Fried Rice', category: 'Fried Rice', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Chicken Schezwan Fried Rice', category: 'Fried Rice', priceHalf: 150, price: 190, dietType: 'NON_VEG' },
  { name: 'Egg Fried Rice', category: 'Fried Rice', priceHalf: 140, price: 180, dietType: 'NON_VEG' },

  // Main Course (Veg)
  { name: 'Dal Tadka', category: 'Main Course (Veg)', priceHalf: 130, price: 190, dietType: 'VEG' },
  { name: 'Dal Makhni', category: 'Main Course (Veg)', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Jeera Aloo', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Aloo Matar', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Gobhi Aloo', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Chana Masala', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Aloo Palak', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Rajma Masala', category: 'Main Course (Veg)', priceHalf: 120, price: 180, dietType: 'VEG' },
  { name: 'Mix Veg', category: 'Main Course (Veg)', priceHalf: 180, price: 260, dietType: 'VEG' },
  { name: 'Dum Aloo', category: 'Main Course (Veg)', priceHalf: 140, price: 190, dietType: 'VEG' },
  { name: 'Soya Chaap Masala', category: 'Main Course (Veg)', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Kadhai Soya Chaap', category: 'Main Course (Veg)', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Kadhai Mushroom', category: 'Main Course (Veg)', priceHalf: 190, price: 250, dietType: 'VEG' },
  { name: 'Mushroom Masala', category: 'Main Course (Veg)', priceHalf: 190, price: 250, dietType: 'VEG' },
  { name: 'Mushroom Do Pyaza', category: 'Main Course (Veg)', priceHalf: 190, price: 250, dietType: 'VEG' },
  { name: 'Mushroom Tikka Masala', category: 'Main Course (Veg)', priceHalf: 200, price: 260, dietType: 'VEG' },
  { name: 'Shahi Paneer', category: 'Main Course (Veg)', priceHalf: 180, price: 260, dietType: 'VEG' },
  { name: 'Matar Paneer', category: 'Main Course (Veg)', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Palak Paneer', category: 'Main Course (Veg)', priceHalf: 160, price: 260, dietType: 'VEG' },
  { name: 'Kadhai Paneer', category: 'Main Course (Veg)', priceHalf: 180, price: 260, dietType: 'VEG' },
  { name: 'Paneer Do Pyaza', category: 'Main Course (Veg)', priceHalf: 180, price: 260, dietType: 'VEG' },
  { name: 'Paneer Lababdar', category: 'Main Course (Veg)', priceHalf: 180, price: 260, dietType: 'VEG' },
  { name: 'Paneer Butter Masala', category: 'Main Course (Veg)', priceHalf: 190, price: 270, dietType: 'VEG' },
  { name: 'Paneer Tikka Masala', category: 'Main Course (Veg)', priceHalf: 210, price: 290, dietType: 'VEG' },
  { name: 'Paneer Bhurjee', category: 'Main Course (Veg)', priceHalf: 220, price: 300, dietType: 'VEG' },
  { name: 'Tawa Paneer', category: 'Main Course (Veg)', priceHalf: 190, price: 270, dietType: 'VEG' },

  // Main Course (Non-Veg)
  { name: 'Kadhai Chicken', category: 'Main Course (Non-Veg)', priceHalf: 260, price: 420, dietType: 'NON_VEG' },
  { name: 'Chicken Tikka Masala', category: 'Main Course (Non-Veg)', priceHalf: 260, price: 420, dietType: 'NON_VEG' },
  { name: 'Chicken Kholapuri', category: 'Main Course (Non-Veg)', priceHalf: 240, price: 390, dietType: 'NON_VEG' },
  { name: 'Chicken Rogan Josh', category: 'Main Course (Non-Veg)', priceHalf: 240, price: 390, dietType: 'NON_VEG' },
  { name: 'Chicken Rara', category: 'Main Course (Non-Veg)', priceHalf: 270, price: 420, dietType: 'NON_VEG' },
  { name: 'Butter Chicken', category: 'Main Course (Non-Veg)', priceHalf: 260, price: 420, dietType: 'NON_VEG' },
  { name: 'Chicken Do Pyaza', category: 'Main Course (Non-Veg)', priceHalf: 260, price: 420, dietType: 'NON_VEG' },
  { name: 'Chicken Curry', category: 'Main Course (Non-Veg)', priceHalf: 240, price: 400, dietType: 'NON_VEG' },
  { name: 'Tawa Chicken', category: 'Main Course (Non-Veg)', priceHalf: 280, price: 420, dietType: 'NON_VEG' },
  { name: 'Chicken Masala', category: 'Main Course (Non-Veg)', priceHalf: 240, price: 410, dietType: 'NON_VEG' },
  { name: 'Chicken Kabab Masala', category: 'Main Course (Non-Veg)', priceHalf: 220, price: 350, dietType: 'NON_VEG' },
  { name: 'Egg Curry', category: 'Main Course (Non-Veg)', priceHalf: 140, price: 220, dietType: 'NON_VEG' },
  { name: 'Egg Bhurjee', category: 'Main Course (Non-Veg)', priceHalf: 120, price: 180, dietType: 'NON_VEG' },

  // Mutton
  { name: 'Ghee Roast Mutton', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },
  { name: 'Mutton Rogan Josh', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },
  { name: 'Mutton Masala', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },
  { name: 'Kadhai Mutton', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },
  { name: 'Mutton Curry', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },
  { name: 'Handi Mutton', category: 'Mutton', priceHalf: 250, price: 450, dietType: 'NON_VEG' },

  // Biryani
  { name: 'Veg Biryani', category: 'Biryani', priceHalf: 140, price: 200, dietType: 'VEG' },
  { name: 'Paneer Biryani', category: 'Biryani', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Mushroom Biryani', category: 'Biryani', priceHalf: 160, price: 220, dietType: 'VEG' },
  { name: 'Mix Veg Biryani', category: 'Biryani', priceHalf: 170, price: 220, dietType: 'VEG' },
  { name: 'Special Soya Chaap Biryani', category: 'Biryani', priceHalf: 180, price: 220, dietType: 'VEG' },
  { name: 'Egg Biryani', category: 'Biryani', priceHalf: 150, price: 250, dietType: 'NON_VEG' },
  { name: 'Chicken Biryani', category: 'Biryani', priceHalf: 190, price: 290, dietType: 'NON_VEG' },
  { name: 'Mutton Biryani', category: 'Biryani', priceHalf: null, price: 350, dietType: 'NON_VEG' },

  // Bread
  { name: 'Tandoori Roti', category: 'Bread', priceHalf: null, price: 12, dietType: 'VEG' },
  { name: 'Butter Roti', category: 'Bread', priceHalf: null, price: 15, dietType: 'VEG' },
  { name: 'Garlic Roti', category: 'Bread', priceHalf: null, price: 25, dietType: 'VEG' },
  { name: 'Naan', category: 'Bread', priceHalf: null, price: 25, dietType: 'VEG' },
  { name: 'Butter Naan', category: 'Bread', priceHalf: null, price: 30, dietType: 'VEG' },
  { name: 'Garlic Naan', category: 'Bread', priceHalf: null, price: 40, dietType: 'VEG' },
  { name: 'Stuffed Naan', category: 'Bread', priceHalf: null, price: 60, dietType: 'VEG' },
  { name: 'Lachha Paratha', category: 'Bread', priceHalf: null, price: 40, dietType: 'VEG' },

  // Drinks
  { name: 'Classic Mojito', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Blue Lagoon', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Green Apple Mojito', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Blue Berry Mojito', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Pineapple Punch', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Kala Khatta', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Strawberry Mojito', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Cold Coffee', category: 'Drinks', priceHalf: null, price: 80, dietType: 'VEG' },
  { name: 'Oreo Shake', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Blue Berry Shake', category: 'Drinks', priceHalf: null, price: 120, dietType: 'VEG' },
  { name: 'Black Current Shake', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Chocolate Shake', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' },
  { name: 'Strawberry Shake', category: 'Drinks', priceHalf: null, price: 100, dietType: 'VEG' }
];

async function seed() {
  console.log('Fetching first restaurant...');
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    console.error('No restaurant found! Start app and register first.');
    return;
  }

  console.log('Seeding menu items for restaurant', restaurant.name);
  
  let count = 0;
  for (const item of menuItemsData) {
    // Upsert by name and restaurant to avoid duplicates
    const hasHalfFull = item.priceHalf !== null;
    
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: item.name
      }
    });

    if (existingItem) {
      await prisma.menuItem.update({
        where: { id: existingItem.id },
        data: {
          category: item.category,
          price: item.price,
          dietType: item.dietType as any,
          hasHalfFullOption: hasHalfFull,
          priceHalf: item.priceHalf
        }
      });
    } else {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          name: item.name,
          category: item.category,
          price: item.price,
          dietType: item.dietType as any,
          hasHalfFullOption: hasHalfFull,
          priceHalf: item.priceHalf,
          available: true,
          imageUrl: ''
        }
      });
    }
    count++;
  }
  
  console.log(`Successfully seeded ${count} menu items!`);
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
