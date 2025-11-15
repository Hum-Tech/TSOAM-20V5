const crypto = require('crypto');

/**
 * Hash a password using PBKDF2
 * @param {string} password - Plain text password
 * @returns {string} Hashed password with salt
 */
function hashPassword(password) {
  // Generate a salt
  const salt = crypto.randomBytes(32).toString('hex');
  
  // Hash the password with PBKDF2
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  
  // Return salt and hash together
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored hash (salt:hash format)
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hashedPassword) {
  try {
    const [salt, hash] = hashedPassword.split(':');
    
    if (!salt || !hash) {
      return false;
    }
    
    const hashVerify = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');
    
    return hash === hashVerify;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
