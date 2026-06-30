/**
 * Order Utilities
 * Shared functions for order management across the application
 */

import { ORDER_STATUS_FLOW, type OrderStatus } from './constants';

// ═══════════════════════════════════════════════════════════════════
// ITEM MERGING
// ═══════════════════════════════════════════════════════════════════

/**
 * Merge duplicate order items (same menu item + special instructions)
 * Used in: printUtils, TableDrawer, ReceiptPrintTemplate
 */
export function mergeOrderItems(items: any[]): any[] {
  const merged: any[] = [];
  
  items.forEach((item: any) => {
    // Clean special instructions
    const cleanInstr = (item.specialInstructions || '')
      .replace(/\[URGENT ADDITION\]/g, '')
      .replace(/\[SERVED\]/g, '')
      .trim();
    
    // Find existing item with same menuItemId and instructions
    const existing = merged.find(
      (i) => 
        i.menuItem?.id === item.menuItem?.id && 
        i.cleanInstr === cleanInstr &&
        i.status === item.status // Only merge items with same status
    );
    
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.push({ ...item, cleanInstr });
    }
  });
  
  return merged;
}

// ═══════════════════════════════════════════════════════════════════
// ORDER STATUS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if order status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] as any;
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Get next available status options for an order
 */
export function getNextStatusOptions(currentStatus: OrderStatus): OrderStatus[] {
  return (ORDER_STATUS_FLOW[currentStatus] as unknown as OrderStatus[]) || [];
}

/**
 * Check if order is in a terminal state (completed/cancelled)
 */
export function isOrderTerminal(status: string): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Check if order is active (can still be modified)
 */
export function isOrderActive(status: string): boolean {
  return ['PENDING', 'PREPARING', 'READY'].includes(status);
}

// ═══════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate total for order items
 */
export function calculateOrderTotal(items: any[]): number {
  return items.reduce((total, item) => {
    if (item.status === 'CANCELLED') return total;
    const price = item.menuItem?.price ?? item.price ?? 0;
    return total + (price * item.quantity);
  }, 0);
}

/**
 * Calculate order statistics
 */
export function calculateOrderStats(orders: any[]): {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  completed: number;
} {
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    ready: orders.filter(o => o.status === 'READY').length,
    served: orders.filter(o => o.status === 'SERVED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };
}

/**
 * Get total quantity of items in order
 */
export function getTotalQuantity(items: any[]): number {
  return items.reduce((sum, item) => {
    if (item.status === 'CANCELLED') return sum;
    return sum + (item.quantity || 0);
  }, 0);
}

/**
 * Get active (non-cancelled) items
 */
export function getActiveItems(items: any[]): any[] {
  return items.filter(item => item.status !== 'CANCELLED');
}

// ═══════════════════════════════════════════════════════════════════
// TIME CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate elapsed time since order creation
 */
export function getOrderElapsedTime(createdAt: string | Date): {
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const totalSeconds = Math.floor((now - created) / 1000);
  
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

/**
 * Check if order is urgent (> threshold minutes)
 */
export function isOrderUrgent(createdAt: string | Date, thresholdMinutes: number = 15): boolean {
  const { minutes } = getOrderElapsedTime(createdAt);
  return minutes >= thresholdMinutes;
}

/**
 * Format elapsed time for display
 */
export function formatElapsedTime(createdAt: string | Date): string {
  const { minutes, seconds } = getOrderElapsedTime(createdAt);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════
// GROUPING & SORTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Group orders by status
 */
export function groupOrdersByStatus(orders: any[]): Record<string, any[]> {
  return orders.reduce((groups, order) => {
    const status = order.status || 'UNKNOWN';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(order);
    return groups;
  }, {} as Record<string, any[]>);
}

/**
 * Group orders by table
 */
export function groupOrdersByTable(orders: any[]): Record<string, any[]> {
  return orders.reduce((groups, order) => {
    const tableId = order.tableId || 'NO_TABLE';
    if (!groups[tableId]) {
      groups[tableId] = [];
    }
    groups[tableId].push(order);
    return groups;
  }, {} as Record<string, any[]>);
}

/**
 * Sort orders by creation time (oldest first)
 */
export function sortOrdersByTime(orders: any[], ascending: boolean = true): any[] {
  return [...orders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return ascending ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Sort orders by priority (urgent first, then by time)
 */
export function sortOrdersByPriority(orders: any[]): any[] {
  return [...orders].sort((a, b) => {
    const urgentA = isOrderUrgent(a.createdAt);
    const urgentB = isOrderUrgent(b.createdAt);
    
    // Urgent orders first
    if (urgentA && !urgentB) return -1;
    if (!urgentA && urgentB) return 1;
    
    // Then by creation time (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

// ═══════════════════════════════════════════════════════════════════
// ORDER IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate short order ID for display (last 6 chars)
 */
export function getShortOrderId(orderId: string): string {
  return orderId.slice(-6).toUpperCase();
}

/**
 * Generate token from order ID (last 3 chars)
 */
export function getOrderToken(orderId: string): string {
  return orderId.slice(-3).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate order has required items
 */
export function validateOrderHasItems(items: any[]): boolean {
  const activeItems = getActiveItems(items);
  return activeItems.length > 0;
}

/**
 * Check if order can be billed
 */
export function canGenerateBill(order: any): boolean {
  // Must have active items
  if (!validateOrderHasItems(order.items || [])) {
    return false;
  }
  
  // Must not already have a bill
  if (order.bill) {
    return false;
  }
  
  // Payment status must be PENDING
  if (order.paymentStatus !== 'PENDING') {
    return false;
  }
  
  return true;
}

/**
 * Check if order can be cancelled/deleted
 */
export function canCancelOrder(order: any): boolean {
  // Cannot cancel if bill generated
  if (order.bill) {
    return false;
  }
  
  // Cannot cancel if already completed
  if (order.status === 'COMPLETED') {
    return false;
  }
  
  // Cannot cancel if paid
  if (order.paymentStatus === 'PAID') {
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const orderUtils = {
  mergeOrderItems,
  isValidStatusTransition,
  getNextStatusOptions,
  isOrderTerminal,
  isOrderActive,
  calculateOrderTotal,
  calculateOrderStats,
  getTotalQuantity,
  getActiveItems,
  getOrderElapsedTime,
  isOrderUrgent,
  formatElapsedTime,
  groupOrdersByStatus,
  groupOrdersByTable,
  sortOrdersByTime,
  sortOrdersByPriority,
  getShortOrderId,
  getOrderToken,
  validateOrderHasItems,
  canGenerateBill,
  canCancelOrder,
};

export default orderUtils;
