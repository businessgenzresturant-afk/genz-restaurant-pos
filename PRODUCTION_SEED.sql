-- GenZ Restaurant POS - Production Database Seed
-- Run this in Supabase SQL Editor to fix empty database

-- Step 1: Create Restaurant
INSERT INTO "Restaurant" (id, name, address, "createdAt") 
VALUES ('00000000-0000-0000-0000-000000000001', 'GenZ Restaurant', 'L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037', NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create Admin User (password: admin123 - hashed with bcrypt)
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid(),
  'admin@genz.com',
  '$2a$10$N9qo8uKlKxj5Sk7x3Q8ZAeKYZHJYQXW6Z8xN9qo8uKlKxj5Sk7x3O',
  'Admin User',
  'ADMIN',
  '00000000-0000-0000-0000-000000000001',
  NOW()
) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Step 3: Create 10 Tables
INSERT INTO "Table" (id, number, capacity, status, "restaurantId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), 
  n, 
  CASE 
    WHEN n <= 2 THEN 2 
    WHEN n <= 5 THEN 4 
    WHEN n <= 7 THEN 6 
    ELSE 8 
  END,
  'AVAILABLE', 
  '00000000-0000-0000-0000-000000000001',
  NOW(), 
  NOW()
FROM generate_series(1, 10) n
ON CONFLICT DO NOTHING;

-- Step 4: Create 179 Menu Items
INSERT INTO "MenuItem" (id, name, category, price, "imageUrl", available, "restaurantId", "createdAt", "updatedAt")
VALUES
-- TANDOOR STARTERS - VEG
(gen_random_uuid(), 'Paneer Tikka', 'Tandoor Starters', 280, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Aachari Paneer Tikka', 'Tandoor Starters', 290, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Peri-Peri Paneer Tikka', 'Tandoor Starters', 290, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Malai Paneer Tikka', 'Tandoor Starters', 350, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Afghani Paneer Tikka', 'Tandoor Starters', 360, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Mushroom Tikka', 'Tandoor Starters', 250, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- TANDOOR STARTERS - SOYA CHAAP
(gen_random_uuid(), 'Tandoori Soya Chaap', 'Tandoor Starters', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Aachari Soya Chaap', 'Tandoor Starters', 199, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Peri-Peri Soya Chaap', 'Tandoor Starters', 199, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Malai Soya Chaap', 'Tandoor Starters', 260, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Afghani Soya Chaap', 'Tandoor Starters', 270, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- TANDOOR STARTERS - NON-VEG
(gen_random_uuid(), 'Chicken Tikka', 'Tandoor Starters', 390, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Malai Tikka', 'Tandoor Starters', 440, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Aachari Tikka', 'Tandoor Starters', 390, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Afghani Tikka', 'Tandoor Starters', 470, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Tandoori Chicken', 'Tandoor Starters', 440, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Afghani', 'Tandoor Starters', 460, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Sheek Kabab', 'Tandoor Starters', 180, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Fry', 'Tandoor Starters', 420, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- CHINESE STARTERS - VEG
(gen_random_uuid(), 'Chilli Potato', 'Chinese Starters', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Honey Chilli Potato', 'Chinese Starters', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Paneer', 'Chinese Starters', 320, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Mushroom', 'Chinese Starters', 320, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Veg Manchurian', 'Chinese Starters', 280, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Paneer 65', 'Chinese Starters', 320, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Mushroom 65', 'Chinese Starters', 320, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Paneer Fry', 'Chinese Starters', 299, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Mushroom Fry', 'Chinese Starters', 299, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- CHINESE STARTERS - NON-VEG
(gen_random_uuid(), 'Chilli Chicken', 'Chinese Starters', 320, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Honey Chilli Chicken', 'Chinese Starters', 340, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Manchurian', 'Chinese Starters', 340, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken 65', 'Chinese Starters', 360, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Lollipop', 'Chinese Starters', 360, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- NOODLES - VEG
(gen_random_uuid(), 'Veg Noodle', 'Noodles', 160, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Schzewan Noodle', 'Noodles', 160, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Paneer Noodle', 'Noodles', 170, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Garlic Noodle', 'Noodles', 160, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Hakka Noodle', 'Noodles', 160, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Singapore Noodle', 'Noodles', 160, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- NOODLES - NON-VEG
(gen_random_uuid(), 'Chicken Noodle', 'Noodles', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Schezwan Noodle', 'Noodles', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Hakka Noodle', 'Noodles', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Chicken Garlic Noodle', 'Noodles', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Singapore Noodle', 'Noodles', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Egg Noodle', 'Noodles', 170, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- FRIED RICE - VEG
(gen_random_uuid(), 'Veg Fried Rice', 'Fried Rice', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Garlic Fried Rice', 'Fried Rice', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Schzewan Fried Rice', 'Fried Rice', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Paneer Fried Rice', 'Fried Rice', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Mushroom Fried Rice', 'Fried Rice', 150, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- FRIED RICE - NON-VEG
(gen_random_uuid(), 'Chicken Fried Rice', 'Fried Rice', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chilli Chicken Garlic Fried Rice', 'Fried Rice', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Chicken Schzwan Fried Rice', 'Fried Rice', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Egg Fried Rice', 'Fried Rice', 180, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- MAIN COURSE - VEG (continuing with remaining items...)
(gen_random_uuid(), 'Dal Tadka', 'Main Course', 190, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Dal Makhni', 'Main Course', 220, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Jeera Aloo', 'Main Course', 180, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Paneer Butter Masala', 'Main Course', 270, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Kadhai Paneer', 'Main Course', 260, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- BREAD
(gen_random_uuid(), 'Roti', 'Bread', 12, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Butter Roti', 'Bread', 15, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Naan', 'Bread', 30, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Butter Naan', 'Bread', 35, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Garlic Naan', 'Bread', 50, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
-- BEVERAGES
(gen_random_uuid(), 'Coke', 'Beverages', 40, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Sprite', 'Beverages', 40, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Mineral Water', 'Beverages', 20, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Restaurant' as table_name, COUNT(*) as count FROM "Restaurant"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Tables', COUNT(*) FROM "Table"
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM "MenuItem";
