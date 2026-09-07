class GarbageCollector {
    static init() {

        setInterval(() => {
            if (global.gc) {
                global.gc();
                console.log('🗑️ Garbage collection completed');
            }
        }, 600000);
        
   
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            if (memMB > 150) { 
                console.warn(`⚠️ Memory usage: ${memMB}MB`);
                
                if (global.gc) {
                    global.gc();
                    console.log('🗑️ Forced garbage collection due to high memory');
                }
            }
        }, 300000);
    }
    
    static forceCleanup() {
        if (global.gc) {
            global.gc();
            console.log('🗑️ Manual garbage collection');
        }
    }
}

module.exports = GarbageCollector;
