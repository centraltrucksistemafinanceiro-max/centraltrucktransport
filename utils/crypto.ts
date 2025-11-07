// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a random salt.
 * @param {number} length The length of the salt.
 * @returns {string} The generated salt as a hex string.
 */
export const generateSalt = (length = 16): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
};

/**
 * Hashes a password with a salt using SHA-256.
 * @param {string} password The password to hash.
 * @param {string} salt The salt to use.
 * @returns {Promise<string>} The hashed password as a hex string.
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const params = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: new Uint8Array(salt.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))),
        iterations: 100000
    } as Pbkdf2Params;
    const derivedBits = await window.crypto.subtle.deriveBits(params, baseKey, 256);
    return bufferToHex(derivedBits);
};

/**
 * Verifies a password against a stored salt and hash.
 * @param {string} password The password to verify.
 * @param {string} salt The stored salt.
 * @param {string} hash The stored hash.
 * @returns {Promise<boolean>} True if the password is correct, false otherwise.
 */
export const verifyPassword = async (password: string, salt: string, hash: string): Promise<boolean> => {
    const newHash = await hashPassword(password, salt);
    return newHash === hash;
};
