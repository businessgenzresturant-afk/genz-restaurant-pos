/**
 * Application Constants
 * Central location for all hardcoded values
 */

// ═══════════════════════════════════════════════════════════════════
// BUSINESS LOGIC CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const LOYALTY = {
  POINTS_PER_100_RUPEES: 10,      // Earn 10 points per ₹100 spent
  REDEMPTION_VALUE_PER_POINT: 1,  // 1 point = ₹1
  MIN_POINTS_TO_REDEEM: 50,       // Minimum 50 points required for redemption
} as const;

export const TAX = {
  GST_RATE: 0.18,                 // 18% GST (9% CGST + 9% SGST)
  CGST_RATE: 0.09,                // 9% CGST
  SGST_RATE: 0.09,                // 9% SGST
} as const;

export const SERVICE_CHARGE = {
  DEFAULT_RATE: 0.10,             // 10% service charge
  MAX_RATE: 0.15,                 // Maximum 15% allowed
} as const;

export const ORDER = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 999,
  MAX_ITEMS_PER_ORDER: 100,
  MIN_ORDER_AMOUNT: 0,            // Minimum order amount (₹0 - no minimum)
} as const;

export const TABLE = {
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 50,
  AUTO_CLEAR_TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const;

export const MENU = {
  MAX_NAME_LENGTH: 200,
  MAX_CATEGORY_LENGTH: 100,
  MAX_PRICE: 100000,
  MAX_STOCK_QUANTITY: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════════
// TECHNICAL CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const POLLING = {
  DASHBOARD_REFRESH: 5000,        // 5 seconds
  KDS_DISPLAY: 5000,              // 5 seconds
  KOT_PAGE: 10000,                // 10 seconds
} as const;

export const CACHE = {
  DASHBOARD_TTL: 5000,            // 5 seconds
  MENU_TTL: 60000,                // 1 minute
  TABLES_TTL: 10000,              // 10 seconds
} as const;

export const RATE_LIMIT = {
  AUTH: { maxRequests: 5, windowMs: 60000 },        // 5 req/min
  API: { maxRequests: 100, windowMs: 60000 },       // 100 req/min
  READ: { maxRequests: 200, windowMs: 60000 },      // 200 req/min
  PUBLIC: { maxRequests: 300, windowMs: 60000 },    // 300 req/min for KDS
} as const;

export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,            // 1 second
  MAX_DELAY: 5000,                // 5 seconds
} as const;

export const TIMEOUT = {
  API_REQUEST: 30000,             // 30 seconds
  DATABASE_QUERY: 10000,          // 10 seconds
} as const;

// ═══════════════════════════════════════════════════════════════════
// UI CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const TOAST = {
  SUCCESS_DURATION: 3000,         // 3 seconds
  ERROR_DURATION: 5000,           // 5 seconds
  INFO_DURATION: 3000,            // 3 seconds
} as const;

export const MODAL = {
  ANIMATION_DURATION: 200,        // 200ms
} as const;

export const SOUND = {
  NEW_ORDER_REPEAT: 4,            // Repeat 4 times
  URGENT_ORDER_REPEAT: 6,         // Repeat 6 times
  REPEAT_INTERVAL: 30000,         // 30 seconds
  URGENT_THRESHOLD: 15 * 60 * 1000, // 15 minutes
} as const;

// ═══════════════════════════════════════════════════════════════════
// RESTAURANT INFO (Should come from DB in production)
// ═══════════════════════════════════════════════════════════════════

export const RESTAURANT_INFO = {
  NAME: 'Gen-Z Restaurant',
  ADDRESS: 'Gali No 7, L-97, near Labour Chowk, K-Block, Mahipalpur Village, New Delhi - 110037',
  GST_NUMBER: '07AABCG1234A1Z5',
  PHONE: '+91 98765-43210',
  WEBSITE: 'gen-z.online',
  CURRENCY: '₹',
} as const;

// ═══════════════════════════════════════════════════════════════════
// PRINTER SETTINGS
// ═══════════════════════════════════════════════════════════════════

export const PRINTER = {
  THERMAL_WIDTH_MM: 80,           // 80mm standard thermal
  LOGO_SIZE_MM: 60,               // 60mm logo watermark
  LOGO_OPACITY: 0.08,             // 8% opacity for watermark
  AUTO_PRINT_DELAY: 500,          // 500ms delay before print
} as const;

// ═══════════════════════════════════════════════════════════════════
// ORDER STATUS FLOW
// ═══════════════════════════════════════════════════════════════════

export const ORDER_STATUS_FLOW = {
  PENDING: ['PREPARING', 'READY', 'SERVED', 'COMPLETED'],
  PREPARING: ['READY', 'SERVED', 'COMPLETED'],
  READY: ['SERVED', 'COMPLETED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_FLOW;

// ═══════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES
// ═══════════════════════════════════════════════════════════════════

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_QUANTITY: `Quantity must be between ${ORDER.MIN_QUANTITY} and ${ORDER.MAX_QUANTITY}`,
  INVALID_PRICE: `Price must be between 0 and ${MENU.MAX_PRICE}`,
  ORDER_NOT_FOUND: 'Order not found',
  TABLE_NOT_AVAILABLE: 'Table is not available',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  BILL_ALREADY_GENERATED: 'Bill already generated for this order',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_ORDER_STATUS: 'Invalid order status transition',
} as const;

// ═══════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════

export type Constants = typeof LOYALTY | typeof TAX | typeof SERVICE_CHARGE;
