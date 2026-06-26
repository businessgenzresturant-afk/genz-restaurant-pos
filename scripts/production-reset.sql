-- 🔥 PRODUCTION RESET SCRIPT
-- This script cleans database and sets up proper admin + staff accounts
-- Run: psql postgresql://postgres:password@localhost:5432/restaurant_pos -f scripts/production-reset.sql

BEGIN;

-- Get the main restaurant ID (business.genzresturant@gmail.com's restaurant)
DO $$
DECLARE
    main_restaurant_id UUID;
    admin_user_id UUID;
    staff_user_id UUID;
BEGIN
    -- Find the main restaurant ID
    SELECT "restaurantId" INTO main_restaurant_id 
    FROM "User" 
    WHERE email = 'business.genzresturant@gmail.com' 
    LIMIT 1;

    IF main_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Main admin user not found. Please ensure business.genzresturant@gmail.com exists.';
    END IF;

    RAISE NOTICE 'Main Restaurant ID: %', main_restaurant_id;

    -- Store admin user ID
    SELECT id INTO admin_user_id 
    FROM "User" 
    WHERE email = 'business.genzresturant@gmail.com';

    RAISE NOTICE 'Admin User ID: %', admin_user_id;

    -- ===== STEP 1: DELETE ALL TRANSACTIONAL DATA =====
    RAISE NOTICE 'Deleting all bills...';
    DELETE FROM "Bill";

    RAISE NOTICE 'Deleting all order items...';
    DELETE FROM "OrderItem";

    RAISE NOTICE 'Deleting all orders...';
    DELETE FROM "Order";

    -- ===== STEP 2: RESET TABLE STATUS =====
    RAISE NOTICE 'Resetting all tables to AVAILABLE...';
    UPDATE "Table" 
    SET status = 'AVAILABLE' 
    WHERE "restaurantId"::text = main_restaurant_id::text;

    -- ===== STEP 3: DELETE OTHER RESTAURANTS & USERS =====
    RAISE NOTICE 'Deleting other restaurants and their users...';
    
    -- Delete users from other restaurants
    DELETE FROM "User" 
    WHERE "restaurantId"::text != main_restaurant_id::text;

    -- Delete other restaurants
    DELETE FROM "Restaurant" 
    WHERE id::text != main_restaurant_id::text;

    -- Delete test/concurrent users from main restaurant (keep only admin)
    DELETE FROM "User" 
    WHERE "restaurantId"::text = main_restaurant_id::text 
    AND email NOT IN ('business.genzresturant@gmail.com', 'staff.genzrestaurant@gmail.com');

    -- ===== STEP 4: CREATE/UPDATE STAFF ACCOUNT =====
    RAISE NOTICE 'Setting up staff account...';
    
    -- Check if staff account exists
    SELECT id INTO staff_user_id 
    FROM "User" 
    WHERE email = 'staff.genzrestaurant@gmail.com';

    IF staff_user_id IS NULL THEN
        -- Create new staff account
        -- Password: Staff@123 (bcrypt hash)
        INSERT INTO "User" (id, email, name, password, role, "restaurantId", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'staff.genzrestaurant@gmail.com',
            'Staff Member',
            '$2b$10$Ztd8W6UPu0QT.dM8jRNF1.Byx7wgbadCP3nWB6bg871RtQlYY0Gse',  -- Staff@123
            'STAFF',
            main_restaurant_id,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Staff account created: staff.genzrestaurant@gmail.com (Password: Staff@123)';
    ELSE
        -- Update existing staff account
        UPDATE "User"
        SET 
            name = 'Staff Member',
            role = 'STAFF',
            "restaurantId" = main_restaurant_id,
            "updatedAt" = NOW()
        WHERE id = staff_user_id;
        RAISE NOTICE 'Staff account updated: staff.genzrestaurant@gmail.com';
    END IF;

    -- ===== STEP 5: ENSURE ADMIN ACCOUNT IS CORRECT =====
    UPDATE "User"
    SET 
        role = 'ADMIN',
        "restaurantId" = main_restaurant_id::uuid,
        "updatedAt" = NOW()
    WHERE email = 'business.genzresturant@gmail.com';

    -- ===== STEP 6: UPDATE RESTAURANT INFO =====
    UPDATE "Restaurant"
    SET 
        name = 'GenZ Restaurant',
        address = 'L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037',
        "updatedAt" = NOW()
    WHERE id::text = main_restaurant_id::text;

    RAISE NOTICE '=================================';
    RAISE NOTICE 'PRODUCTION RESET COMPLETE!';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Admin: business.genzresturant@gmail.com (Full Access)';
    RAISE NOTICE 'Staff: staff.genzrestaurant@gmail.com (Password: Staff@123)';
    RAISE NOTICE '=================================';

END $$;

COMMIT;

-- Verify final state
SELECT '=== FINAL USER ACCOUNTS ===' as status;
SELECT email, name, role FROM "User" ORDER BY role DESC, email;

SELECT '=== RESTAURANT INFO ===' as status;
SELECT id, name, address FROM "Restaurant";

SELECT '=== TABLE STATUS ===' as status;
SELECT COUNT(*) as total_tables, status FROM "Table" GROUP BY status;

SELECT '=== DATA COUNTS ===' as status;
SELECT 
    (SELECT COUNT(*) FROM "Order") as orders,
    (SELECT COUNT(*) FROM "OrderItem") as order_items,
    (SELECT COUNT(*) FROM "Bill") as bills,
    (SELECT COUNT(*) FROM "Table") as tables,
    (SELECT COUNT(*) FROM "MenuItem") as menu_items;
