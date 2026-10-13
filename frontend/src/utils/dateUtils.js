/**
 * Date formatting utilities for EcoLink orders and tracking
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a Date object or timestamp string into clean format: "15 Sep 2026"
 * @param {Date|string|number} dateVal
 * @returns {string} Formatted date string, e.g. "15 Sep 2026"
 */
export const formatExpectedDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Get dynamic expected delivery date for an order.
 * Uses order.expectedDeliveryDate if stored in DB, otherwise gracefully defaults
 * to 4 days after the order placement date.
 * @param {Object} order
 * @returns {string} Formatted expected delivery string
 */
export const getOrderExpectedDelivery = (order) => {
  if (!order) return '';
  if (order.expectedDeliveryDate) {
    return formatExpectedDate(order.expectedDeliveryDate);
  }
  // Graceful fallback for pre-existing orders without stored expectedDeliveryDate:
  const baseDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const fallback = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);
  return formatExpectedDate(fallback);
};

/**
 * Get actual delivered date for an order if available from deliveredAt or trackingUpdates
 * @param {Object} order
 * @returns {string} Formatted delivered date string or null
 */
export const getOrderDeliveredDate = (order) => {
  if (!order) return null;
  if (order.deliveredAt) {
    return formatExpectedDate(order.deliveredAt);
  }
  if (order.status === 'Delivered' && Array.isArray(order.trackingUpdates)) {
    const deliveredLog = order.trackingUpdates.slice().reverse().find((t) => t.status === 'Delivered');
    if (deliveredLog?.timestamp) {
      return formatExpectedDate(deliveredLog.timestamp);
    }
  }
  return null;
};
