import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // P0 FIX: Only allow demo seed in development, never in production
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping demo seed in production environment');
    console.log('✅ Please create admin account manually via /api/auth/register');
    return;
  }

  console.log('🌱 Starting database seed...');

  // Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'GenZ Restaurant',
      address: '123 Main Street, New Delhi, India 110001',
    },
  });
  console.log('✅ Restaurant created:', restaurant.name);

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@genz.com' },
    update: {},
    create: {
      email: 'admin@genz.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      restaurantId: restaurant.id,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create Staff User
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@genz.com' },
    update: {},
    create: {
      email: 'staff@genz.com',
      password: staffPassword,
      name: 'Staff User',
      role: 'STAFF',
      restaurantId: restaurant.id,
    },
  });
  console.log('✅ Staff user created:', staffUser.email);

  // Create Tables
  const tableData = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 2 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 4 },
    { number: 5, capacity: 4 },
    { number: 6, capacity: 6 },
    { number: 7, capacity: 6 },
    { number: 8, capacity: 8 },
    { number: 9, capacity: 2 },
    { number: 10, capacity: 4 },
  ];

  for (const table of tableData) {
    await prisma.table.upsert({
      where: {
        restaurantId_number: {
          restaurantId: restaurant.id,
          number: table.number,
        },
      },
      update: {},
      create: {
        number: table.number,
        capacity: table.capacity,
        status: 'AVAILABLE',
        restaurantId: restaurant.id,
      },
    });
  }
  console.log('✅ Created 10 tables');

  // Delete existing menu items
  await prisma.menuItem.deleteMany({
    where: { restaurantId: restaurant.id }
  });
  
  // Create Menu Items from PDF
  const menuItems = [
    // === TANDOOR STARTERS - VEG ===
    { name: 'Paneer Tikka', category: 'Tandoor Starters', price: 280, imageUrl: '/images/paneer-tikka.jpg', available: true },
    { name: 'Aachari Paneer Tikka', category: 'Tandoor Starters', price: 290, imageUrl: '/images/aachari-paneer.jpg', available: true },
    { name: 'Peri-Peri Paneer Tikka', category: 'Tandoor Starters', price: 290, imageUrl: '/images/peri-paneer.jpg', available: true },
    { name: 'Malai Paneer Tikka', category: 'Tandoor Starters', price: 350, imageUrl: '/images/malai-paneer.jpg', available: true },
    { name: 'Afghani Paneer Tikka', category: 'Tandoor Starters', price: 360, imageUrl: '/images/afghani-paneer.jpg', available: true },
    { name: 'Mushroom Tikka', category: 'Tandoor Starters', price: 250, imageUrl: '/images/mushroom-tikka.jpg', available: true },
    
    // === TANDOOR STARTERS - SOYA CHAAP ===
    { name: 'Tandoori Soya Chaap', category: 'Tandoor Starters', price: 190, imageUrl: '/images/tandoori-soya.jpg', available: true },
    { name: 'Aachari Soya Chaap', category: 'Tandoor Starters', price: 199, imageUrl: '/images/aachari-soya.jpg', available: true },
    { name: 'Peri-Peri Soya Chaap', category: 'Tandoor Starters', price: 199, imageUrl: '/images/peri-soya.jpg', available: true },
    { name: 'Malai Soya Chaap', category: 'Tandoor Starters', price: 260, imageUrl: '/images/malai-soya.jpg', available: true },
    { name: 'Afghani Soya Chaap', category: 'Tandoor Starters', price: 270, imageUrl: '/images/afghani-soya.jpg', available: true },
    
    // === TANDOOR STARTERS - NON-VEG ===
    { name: 'Chicken Tikka', category: 'Tandoor Starters', price: 390, imageUrl: '/images/chicken-tikka.jpg', available: true },
    { name: 'Chicken Malai Tikka', category: 'Tandoor Starters', price: 440, imageUrl: '/images/chicken-malai.jpg', available: true },
    { name: 'Chicken Aachari Tikka', category: 'Tandoor Starters', price: 390, imageUrl: '/images/chicken-aachari.jpg', available: true },
    { name: 'Chicken Afghani Tikka', category: 'Tandoor Starters', price: 470, imageUrl: '/images/chicken-afghani.jpg', available: true },
    { name: 'Tandoori Chicken', category: 'Tandoor Starters', price: 440, imageUrl: '/images/tandoori-chicken.jpg', available: true },
    { name: 'Chicken Afghani', category: 'Tandoor Starters', price: 460, imageUrl: '/images/chicken-afghani-full.jpg', available: true },
    { name: 'Chicken Sheek Kabab', category: 'Tandoor Starters', price: 180, imageUrl: '/images/sheek-kabab.jpg', available: true },
    { name: 'Chicken Fry', category: 'Tandoor Starters', price: 420, imageUrl: '/images/chicken-fry.jpg', available: true },
    
    // === CHINESE STARTERS - VEG ===
    { name: 'Chilli Potato', category: 'Chinese Starters', price: 150, imageUrl: '/images/chilli-potato.jpg', available: true },
    { name: 'Honey Chilli Potato', category: 'Chinese Starters', price: 150, imageUrl: '/images/honey-chilli-potato.jpg', available: true },
    { name: 'Chilli Paneer', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-paneer.jpg', available: true },
    { name: 'Chilli Mushroom', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-mushroom.jpg', available: true },
    { name: 'Veg Manchurian', category: 'Chinese Starters', price: 280, imageUrl: '/images/veg-manchurian.jpg', available: true },
    { name: 'Paneer 65', category: 'Chinese Starters', price: 320, imageUrl: '/images/paneer-65.jpg', available: true },
    { name: 'Mushroom 65', category: 'Chinese Starters', price: 320, imageUrl: '/images/mushroom-65.jpg', available: true },
    { name: 'Paneer Fry', category: 'Chinese Starters', price: 299, imageUrl: '/images/paneer-fry.jpg', available: true },
    { name: 'Mushroom Fry', category: 'Chinese Starters', price: 299, imageUrl: '/images/mushroom-fry.jpg', available: true },
    
    // === CHINESE STARTERS - NON-VEG ===
    { name: 'Chilli Chicken', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-chicken.jpg', available: true },
    { name: 'Honey Chilli Chicken', category: 'Chinese Starters', price: 340, imageUrl: '/images/honey-chilli-chicken.jpg', available: true },
    { name: 'Chicken Manchurian', category: 'Chinese Starters', price: 340, imageUrl: '/images/chicken-manchurian.jpg', available: true },
    { name: 'Chicken 65', category: 'Chinese Starters', price: 360, imageUrl: '/images/chicken-65.jpg', available: true },
    { name: 'Chicken Lollipop', category: 'Chinese Starters', price: 360, imageUrl: '/images/chicken-lollipop.jpg', available: true },
    
    // === NOODLES - VEG ===
    { name: 'Veg Noodle', category: 'Noodles', price: 160, imageUrl: '/images/veg-noodle.jpg', available: true },
    { name: 'Schzewan Noodle', category: 'Noodles', price: 160, imageUrl: '/images/schzewan-noodle.jpg', available: true },
    { name: 'Paneer Noodle', category: 'Noodles', price: 170, imageUrl: '/images/paneer-noodle.jpg', available: true },
    { name: 'Chilli Garlic Noodle', category: 'Noodles', price: 160, imageUrl: '/images/chilli-garlic-noodle.jpg', available: true },
    { name: 'Hakka Noodle', category: 'Noodles', price: 160, imageUrl: '/images/hakka-noodle.jpg', available: true },
    { name: 'Singapore Noodle', category: 'Noodles', price: 160, imageUrl: '/images/singapore-noodle.jpg', available: true },
    
    // === NOODLES - NON-VEG ===
    { name: 'Chicken Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-noodle.jpg', available: true },
    { name: 'Chicken Schezwan Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-schezwan-noodle.jpg', available: true },
    { name: 'Chicken Hakka Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-hakka-noodle.jpg', available: true },
    { name: 'Chilli Chicken Garlic Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chilli-chicken-garlic.jpg', available: true },
    { name: 'Chicken Singapore Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-singapore.jpg', available: true },
    { name: 'Egg Noodle', category: 'Noodles', price: 170, imageUrl: '/images/egg-noodle.jpg', available: true },
    
    // === FRIED RICE - VEG ===
    { name: 'Veg Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/veg-fried-rice.jpg', available: true },
    { name: 'Chilli Garlic Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/chilli-garlic-rice.jpg', available: true },
    { name: 'Schzewan Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/schzewan-rice.jpg', available: true },
    { name: 'Paneer Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/paneer-rice.jpg', available: true },
    { name: 'Mushroom Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/mushroom-rice.jpg', available: true },
    
    // === FRIED RICE - NON-VEG ===
    { name: 'Chicken Fried Rice', category: 'Fried Rice', price: 190, imageUrl: '/images/chicken-rice.jpg', available: true },
    { name: 'Chilli Chicken Garlic Fried Rice', category: 'Fried Rice', price: 190, imageUrl: '/images/chilli-chicken-rice.jpg', available: true },
    { name: 'Chicken Schzwan Fried Rice', category: 'Fried Rice', price: 190, imageUrl: '/images/chicken-schzwan-rice.jpg', available: true },
    { name: 'Egg Fried Rice', category: 'Fried Rice', price: 180, imageUrl: '/images/egg-rice.jpg', available: true },
    
    // === MAIN COURSE - VEG ===
    { name: 'Dal Tadka', category: 'Main Course', price: 190, imageUrl: '/images/dal-tadka.jpg', available: true },
    { name: 'Dal Makhni', category: 'Main Course', price: 220, imageUrl: '/images/dal-makhni.jpg', available: true },
    { name: 'Jeera Aloo', category: 'Main Course', price: 180, imageUrl: '/images/jeera-aloo.jpg', available: true },
    { name: 'Aloo Matar', category: 'Main Course', price: 180, imageUrl: '/images/aloo-matar.jpg', available: true },
    { name: 'Gobhi Aloo', category: 'Main Course', price: 180, imageUrl: '/images/gobhi-aloo.jpg', available: true },
    { name: 'Chana Masala', category: 'Main Course', price: 180, imageUrl: '/images/chana-masala.jpg', available: true },
    { name: 'Aloo Palak', category: 'Main Course', price: 180, imageUrl: '/images/aloo-palak.jpg', available: true },
    { name: 'Rajma Masala', category: 'Main Course', price: 180, imageUrl: '/images/rajma-masala.jpg', available: true },
    { name: 'Mix Veg', category: 'Main Course', price: 260, imageUrl: '/images/mix-veg.jpg', available: true },
    { name: 'Dum Aloo', category: 'Main Course', price: 190, imageUrl: '/images/dum-aloo.jpg', available: true },
    { name: 'Soya Chaap Masala', category: 'Main Course', price: 220, imageUrl: '/images/soya-chaap-masala.jpg', available: true },
    { name: 'Kadhai Soya Chaap', category: 'Main Course', price: 220, imageUrl: '/images/kadhai-soya.jpg', available: true },
    { name: 'Kadhai Mushroom', category: 'Main Course', price: 250, imageUrl: '/images/kadhai-mushroom.jpg', available: true },
    { name: 'Mushroom Masala', category: 'Main Course', price: 250, imageUrl: '/images/mushroom-masala.jpg', available: true },
    { name: 'Mushroom Do-Pyaza', category: 'Main Course', price: 250, imageUrl: '/images/mushroom-do-pyaza.jpg', available: true },
    { name: 'Mushroom Tikka Masala', category: 'Main Course', price: 260, imageUrl: '/images/mushroom-tikka-masala.jpg', available: true },
    { name: 'Shahi Paneer', category: 'Main Course', price: 260, imageUrl: '/images/shahi-paneer.jpg', available: true },
    { name: 'Matar Paneer', category: 'Main Course', price: 220, imageUrl: '/images/matar-paneer.jpg', available: true },
    { name: 'Palak Paneer', category: 'Main Course', price: 260, imageUrl: '/images/palak-paneer.jpg', available: true },
    { name: 'Kadhai Paneer', category: 'Main Course', price: 260, imageUrl: '/images/kadhai-paneer.jpg', available: true },
    { name: 'Paneer Do-Pyaza', category: 'Main Course', price: 260, imageUrl: '/images/paneer-do-pyaza.jpg', available: true },
    { name: 'Paneer Lababdar', category: 'Main Course', price: 260, imageUrl: '/images/paneer-lababdar.jpg', available: true },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 270, imageUrl: '/images/paneer-butter-masala.jpg', available: true },
    { name: 'Paneer Tikka Masala', category: 'Main Course', price: 290, imageUrl: '/images/paneer-tikka-masala.jpg', available: true },
    { name: 'Paneer Bhurjee', category: 'Main Course', price: 300, imageUrl: '/images/paneer-bhurjee.jpg', available: true },
    { name: 'Tawa Paneer', category: 'Main Course', price: 270, imageUrl: '/images/tawa-paneer.jpg', available: true },
    
    // === MAIN COURSE - NON-VEG ===
    { name: 'Kadhai Chicken', category: 'Main Course', price: 420, imageUrl: '/images/kadhai-chicken.jpg', available: true },
    { name: 'Chicken Tikka Masala', category: 'Main Course', price: 420, imageUrl: '/images/chicken-tikka-masala.jpg', available: true },
    { name: 'Chicken Kholapuri', category: 'Main Course', price: 390, imageUrl: '/images/chicken-kholapuri.jpg', available: true },
    { name: 'Chicken Rogan Josh', category: 'Main Course', price: 390, imageUrl: '/images/chicken-rogan-josh.jpg', available: true },
    { name: 'Chicken Rara', category: 'Main Course', price: 420, imageUrl: '/images/chicken-rara.jpg', available: true },
    { name: 'Butter Chicken', category: 'Main Course', price: 420, imageUrl: '/images/butter-chicken.jpg', available: true },
    { name: 'Chicken Do-Pyaza', category: 'Main Course', price: 420, imageUrl: '/images/chicken-do-pyaza.jpg', available: true },
    { name: 'Chicken Curry', category: 'Main Course', price: 400, imageUrl: '/images/chicken-curry.jpg', available: true },
    { name: 'Tawa Chicken', category: 'Main Course', price: 420, imageUrl: '/images/tawa-chicken.jpg', available: true },
    { name: 'Chicken Masala', category: 'Main Course', price: 410, imageUrl: '/images/chicken-masala.jpg', available: true },
    { name: 'Chicken Kabab Masala', category: 'Main Course', price: 350, imageUrl: '/images/chicken-kabab-masala.jpg', available: true },
    { name: 'Egg Curry', category: 'Main Course', price: 220, imageUrl: '/images/egg-curry.jpg', available: true },
    { name: 'Egg Bhurjee', category: 'Main Course', price: 180, imageUrl: '/images/egg-bhurjee.jpg', available: true },
    
    // === MAIN COURSE - MUTTON ===
    { name: 'Ghee Roast Mutton', category: 'Main Course', price: 450, imageUrl: '/images/ghee-roast-mutton.jpg', available: true },
    { name: 'Mutton Rogan Josh', category: 'Main Course', price: 450, imageUrl: '/images/mutton-rogan-josh.jpg', available: true },
    { name: 'Mutton Masala', category: 'Main Course', price: 450, imageUrl: '/images/mutton-masala.jpg', available: true },
    { name: 'Kadhai Mutton', category: 'Main Course', price: 450, imageUrl: '/images/kadhai-mutton.jpg', available: true },
    { name: 'Mutton Curry', category: 'Main Course', price: 450, imageUrl: '/images/mutton-curry.jpg', available: true },
    { name: 'Handi Mutton', category: 'Main Course', price: 450, imageUrl: '/images/handi-mutton.jpg', available: true },
    
    // === BREAD ===
    { name: 'Tandoori Roti', category: 'Bread', price: 12, imageUrl: '/images/tandoori-roti.jpg', available: true },
    { name: 'Tandoori Butter Roti', category: 'Bread', price: 15, imageUrl: '/images/butter-roti.jpg', available: true },
    { name: 'Garlic Roti', category: 'Bread', price: 25, imageUrl: '/images/garlic-roti.jpg', available: true },
    { name: 'Chilli Garlic Roti', category: 'Bread', price: 25, imageUrl: '/images/chilli-garlic-roti.jpg', available: true },
    { name: 'Naan', category: 'Bread', price: 25, imageUrl: '/images/naan.jpg', available: true },
    { name: 'Butter Naan', category: 'Bread', price: 30, imageUrl: '/images/butter-naan.jpg', available: true },
    { name: 'Garlic Naan', category: 'Bread', price: 40, imageUrl: '/images/garlic-naan.jpg', available: true },
    { name: 'Stuffed Naan', category: 'Bread', price: 60, imageUrl: '/images/stuffed-naan.jpg', available: true },
    { name: 'Chilli Garlic Naan', category: 'Bread', price: 50, imageUrl: '/images/chilli-garlic-naan.jpg', available: true },
    { name: 'Lachha Paratha', category: 'Bread', price: 40, imageUrl: '/images/lachha-paratha.jpg', available: true },
    { name: 'Garlic Lachha Paratha', category: 'Bread', price: 50, imageUrl: '/images/garlic-lachha.jpg', available: true },
    { name: 'Chilli Garlic Lachha Paratha', category: 'Bread', price: 50, imageUrl: '/images/chilli-garlic-lachha.jpg', available: true },
    
    // === PARATHA ===
    { name: 'Aloo Paratha', category: 'Paratha', price: 100, imageUrl: '/images/aloo-paratha.jpg', available: true },
    { name: 'Aloo Pyaz Paratha', category: 'Paratha', price: 120, imageUrl: '/images/aloo-pyaz-paratha.jpg', available: true },
    { name: 'Gobhi Paratha', category: 'Paratha', price: 120, imageUrl: '/images/gobhi-paratha.jpg', available: true },
    { name: 'Paneer Paratha', category: 'Paratha', price: 140, imageUrl: '/images/paneer-paratha.jpg', available: true },
    { name: 'Mix Paratha', category: 'Paratha', price: 150, imageUrl: '/images/mix-paratha.jpg', available: true },
    { name: 'Chicken Paratha', category: 'Paratha', price: 160, imageUrl: '/images/chicken-paratha.jpg', available: true },
    
    // === BIRYANI - VEG ===
    { name: 'Veg Biryani', category: 'Biryani', price: 200, imageUrl: '/images/veg-biryani.jpg', available: true },
    { name: 'Paneer Biryani', category: 'Biryani', price: 220, imageUrl: '/images/paneer-biryani.jpg', available: true },
    { name: 'Mushroom Biryani', category: 'Biryani', price: 220, imageUrl: '/images/mushroom-biryani.jpg', available: true },
    { name: 'Mix Veg Biryani', category: 'Biryani', price: 220, imageUrl: '/images/mix-veg-biryani.jpg', available: true },
    { name: 'SPL. Soya Chaap Biryani', category: 'Biryani', price: 220, imageUrl: '/images/soya-chaap-biryani.jpg', available: true },
    
    // === BIRYANI - NON-VEG ===
    { name: 'Egg Biryani', category: 'Biryani', price: 250, imageUrl: '/images/egg-biryani.jpg', available: true },
    { name: 'Chicken Biryani', category: 'Biryani', price: 290, imageUrl: '/images/chicken-biryani.jpg', available: true },
    { name: 'Mutton Biryani', category: 'Biryani', price: 350, imageUrl: '/images/mutton-biryani.jpg', available: true },
    
    // === BASMATI KHAZANA ===
    { name: 'Steam Rice', category: 'Rice', price: 110, imageUrl: '/images/steam-rice.jpg', available: true },
    { name: 'Jeera Rice', category: 'Rice', price: 120, imageUrl: '/images/jeera-rice.jpg', available: true },
    { name: 'Matar Pulao', category: 'Rice', price: 140, imageUrl: '/images/matar-pulao.jpg', available: true },
    { name: 'Vegetable Pulao', category: 'Rice', price: 190, imageUrl: '/images/veg-pulao.jpg', available: true },
    { name: 'Mix Pulao', category: 'Rice', price: 200, imageUrl: '/images/mix-pulao.jpg', available: true },
    
    // === APPETIZER ===
    { name: 'Roasted Papad (2pc)', category: 'Appetizer', price: 40, imageUrl: '/images/roasted-papad.jpg', available: true },
    { name: 'Masala Papad', category: 'Appetizer', price: 50, imageUrl: '/images/masala-papad.jpg', available: true },
    { name: 'Green Salad', category: 'Appetizer', price: 80, imageUrl: '/images/green-salad.jpg', available: true },
    { name: 'Boondi Raita', category: 'Appetizer', price: 50, imageUrl: '/images/boondi-raita.jpg', available: true },
    { name: 'Mix Raita', category: 'Appetizer', price: 70, imageUrl: '/images/mix-raita.jpg', available: true },
    { name: 'Curd', category: 'Appetizer', price: 50, imageUrl: '/images/curd.jpg', available: true },
    
    // === MOMOS ===
    { name: 'Veg Steam Momo', category: 'Momos', price: 80, imageUrl: '/images/veg-steam-momo.jpg', available: true },
    { name: 'Paneer Steam Momo', category: 'Momos', price: 90, imageUrl: '/images/paneer-steam-momo.jpg', available: true },
    { name: 'Chicken Steam Momo', category: 'Momos', price: 100, imageUrl: '/images/chicken-steam-momo.jpg', available: true },
    { name: 'Veg Fried Momo', category: 'Momos', price: 120, imageUrl: '/images/veg-fried-momo.jpg', available: true },
    { name: 'Paneer Fried Momo', category: 'Momos', price: 130, imageUrl: '/images/paneer-fried-momo.jpg', available: true },
    { name: 'Chicken Fried Momo', category: 'Momos', price: 140, imageUrl: '/images/chicken-fried-momo.jpg', available: true },
    { name: 'Veg Gravy Momo', category: 'Momos', price: 90, imageUrl: '/images/veg-gravy-momo.jpg', available: true },
    { name: 'Paneer Gravy Momo', category: 'Momos', price: 100, imageUrl: '/images/paneer-gravy-momo.jpg', available: true },
    { name: 'Chicken Gravy Momo', category: 'Momos', price: 110, imageUrl: '/images/chicken-gravy-momo.jpg', available: true },
    { name: 'Veg Tandoori Momo', category: 'Momos', price: 120, imageUrl: '/images/veg-tandoori-momo.jpg', available: true },
    { name: 'Paneer Tandoori Momo', category: 'Momos', price: 130, imageUrl: '/images/paneer-tandoori-momo.jpg', available: true },
    { name: 'Chicken Tandoori Momo', category: 'Momos', price: 140, imageUrl: '/images/chicken-tandoori-momo.jpg', available: true },
    { name: 'Veg Kurkure Momo', category: 'Momos', price: 120, imageUrl: '/images/veg-kurkure-momo.jpg', available: true },
    { name: 'Paneer Kurkure Momo', category: 'Momos', price: 130, imageUrl: '/images/paneer-kurkure-momo.jpg', available: true },
    { name: 'Chicken Kurkure Momo', category: 'Momos', price: 140, imageUrl: '/images/chicken-kurkure-momo.jpg', available: true },
    
    // === SPRING ROLL ===
    { name: 'Veg Spring Roll (2pc)', category: 'Spring Roll', price: 100, imageUrl: '/images/veg-spring-roll.jpg', available: true },
    { name: 'Paneer Spring Roll (2pc)', category: 'Spring Roll', price: 120, imageUrl: '/images/paneer-spring-roll.jpg', available: true },
    
    // === SOUPS - VEG ===
    { name: 'Veg Hot N Sour Soup', category: 'Soups', price: 100, imageUrl: '/images/veg-hot-sour.jpg', available: true },
    { name: 'Veg Manchow Soup', category: 'Soups', price: 100, imageUrl: '/images/veg-manchow.jpg', available: true },
    { name: 'Veg Burnt Garlic Soup', category: 'Soups', price: 100, imageUrl: '/images/veg-burnt-garlic.jpg', available: true },
    { name: 'Veg Lemon Coriander Soup', category: 'Soups', price: 100, imageUrl: '/images/veg-lemon-coriander.jpg', available: true },
    
    // === SOUPS - NON-VEG ===
    { name: 'Chicken Hot N Sour Soup', category: 'Soups', price: 150, imageUrl: '/images/chicken-hot-sour.jpg', available: true },
    { name: 'Chicken Manchow Soup', category: 'Soups', price: 150, imageUrl: '/images/chicken-manchow.jpg', available: true },
    { name: 'Chicken Burnt Garlic Soup', category: 'Soups', price: 150, imageUrl: '/images/chicken-burnt-garlic.jpg', available: true },
    { name: 'Chicken Lemon Coriander Soup', category: 'Soups', price: 150, imageUrl: '/images/chicken-lemon-coriander.jpg', available: true },
    
    // === REFRESHERS - MOJITO ===
    { name: 'Classic Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/classic-mojito.jpg', available: true },
    { name: 'Blue Lagoon', category: 'Refreshers', price: 100, imageUrl: '/images/blue-lagoon.jpg', available: true },
    { name: 'Green Apple Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/green-apple.jpg', available: true },
    { name: 'Blue Berry Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/blue-berry-mojito.jpg', available: true },
    { name: 'Pineapple Punch', category: 'Refreshers', price: 100, imageUrl: '/images/pineapple-punch.jpg', available: true },
    { name: 'Kala Khatta', category: 'Refreshers', price: 100, imageUrl: '/images/kala-khatta.jpg', available: true },
    { name: 'Strawberry Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/strawberry-mojito.jpg', available: true },
    
    // === SHAKES ===
    { name: 'Cold Coffee', category: 'Shakes', price: 80, imageUrl: '/images/cold-coffee-shake.jpg', available: true },
    { name: 'Oreo Shake', category: 'Shakes', price: 100, imageUrl: '/images/oreo-shake.jpg', available: true },
    { name: 'Blue-Berry Shake', category: 'Shakes', price: 120, imageUrl: '/images/blueberry-shake.jpg', available: true },
    { name: 'Black Current Shake', category: 'Shakes', price: 100, imageUrl: '/images/black-current.jpg', available: true },
    { name: 'Chocolate Shake', category: 'Shakes', price: 100, imageUrl: '/images/chocolate-shake.jpg', available: true },
    { name: 'Strawberry Shake', category: 'Shakes', price: 100, imageUrl: '/images/strawberry-shake.jpg', available: true },
    
    // === BEVERAGES ===
    { name: 'Tea', category: 'Beverages', price: 50, imageUrl: '/images/tea.jpg', available: true },
    { name: 'Hot Coffee', category: 'Beverages', price: 90, imageUrl: '/images/hot-coffee.jpg', available: true },
    { name: 'Chaach', category: 'Beverages', price: 60, imageUrl: '/images/chaach.jpg', available: true },
    { name: 'Fresh Lime Water', category: 'Beverages', price: 50, imageUrl: '/images/lime-water.jpg', available: true },
    { name: 'Lassi', category: 'Beverages', price: 80, imageUrl: '/images/lassi.jpg', available: true },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        restaurantId: restaurant.id,
      },
    });
  }
  console.log(`✅ Created ${menuItems.length} menu items from GenZ Restaurant PDF`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin: admin@genz.com / admin123');
  console.log('   Staff: staff@genz.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
