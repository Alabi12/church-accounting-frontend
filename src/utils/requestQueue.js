// Request queue to prevent too many concurrent requests
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.minDelay = 1000; // 1 second minimum between requests
    this.maxConcurrent = 2; // Maximum concurrent requests
    this.activeCount = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.activeCount >= this.maxConcurrent) return;
    
    this.processing = true;
    
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const { requestFn, resolve, reject } = this.queue.shift();
      
      this.activeCount++;
      
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeCount--;
        
        // Wait before processing next request
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.minDelay));
        }
      }
    }
    
    this.processing = false;
    
    // If there are still items in queue, continue processing
    if (this.queue.length > 0) {
      this.process();
    }
  }
}

export const requestQueue = new RequestQueue();