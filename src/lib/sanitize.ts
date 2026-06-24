/**
 * Input Sanitization Library
 * 
 * Sanitizes user text inputs to prevent XSS attacks by:
 * - Removing HTML tags
 * - Escaping special characters
 * - Trimming whitespace
 */

/**
 * Sanitizes text input by removing HTML tags and escaping special characters
 * @param text - The text to sanitize
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags using a regex
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Escape special characters to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitizes HTML while allowing safe tags (for rich text if needed)
 * Currently removes all HTML for maximum security
 * @param html - The HTML to sanitize
 * @returns Sanitized text with HTML removed
 */
export function sanitizeHtml(html: string): string {
  // For now, we remove all HTML
  // In future, could use a library like DOMPurify for selective allowing
  return sanitizeText(html);
}

/**
 * Sanitizes special instructions to prevent SQL injection and XSS
 * More lenient than sanitizeText - allows common punctuation for instructions
 * @param text - The special instructions text
 * @returns Sanitized text safe for database storage
 */
export function sanitizeSpecialInstructions(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;
  
  // Remove SQL injection patterns
  sanitized = sanitized
    .replace(/--/g, '')                    // SQL comments
    .replace(/\/\*/g, '')                  // Block comment start
    .replace(/\*\//g, '')                  // Block comment end
    .replace(/;(?=\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT|TRUNCATE))/gi, '') // Dangerous SQL
    .replace(/xp_/gi, '')                  // SQL Server extended procs
    .replace(/sp_/gi, '')                  // SQL Server stored procs
    .replace(/0x[0-9a-f]+/gi, '')         // Hex literals
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Script tags
    .replace(/javascript:/gi, '')          // JavaScript protocol
    .replace(/on\w+\s*=/gi, '')           // Event handlers (onclick, onload, etc)
    .replace(/[<>\\]/g, '');              // HTML/Path traversal chars
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 500);
  
  return sanitized;
}

/**
 * Sanitizes customer name/phone to prevent injection attacks
 * @param text - Customer name or phone number
 * @returns Sanitized text
 */
export function sanitizeCustomerInput(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;
  
  // Remove dangerous characters
  sanitized = sanitized
    .replace(/[<>'"\\]/g, '')             // HTML/SQL dangerous chars
    .replace(/--/g, '')                    // SQL comments
    .replace(/;/g, '')                     // Statement terminators
    .replace(/\/\*/g, '')                  // Block comments
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')                  // SQL Server procs
    .replace(/sp_/gi, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 200);
  
  return sanitized;
}
