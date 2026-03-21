// src/services/retry.js
// Retry utility for API calls

export async function withRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Only retry on 429 errors (rate limiting)
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 2}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}