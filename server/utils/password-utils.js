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
    // Handle undefined or null hashedPassword
    if (!hashedPassword) {
      console.error('Password hash is null or undefined');
      return false;
    }

    // Handle case where hashedPassword is not a string
    if (typeof hashedPassword !== 'string') {
      console.error('Password hash is not a string:', typeof hashedPassword);
      return false;
    }

    const parts = hashedPassword.split(':');
    if (parts.length !== 2) {
      console.error('Invalid password hash format - expected salt:hash');
      return false;
    }

    const [salt, hash] = parts;

    if (!salt || !hash) {
      console.error('Salt or hash is empty');
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
