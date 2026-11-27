let worker = null;
let reqCounter = 0;
const pendingRequests = new Map();
const statusListeners = new Set();
let currentEngineStatus = {
  status: 'booting',
  engine: 'initializing',
  message: 'Booting Python WASM Worker...'
};

export function initPyodideWorker() {
  if (worker) return worker;

  try {
    worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url), {
      type: 'classic'
    });

    worker.onmessage = (e) => {
      const { id, type, result, status, engine, message, isReady, error } = e.data;

      if (type === 'STATUS') {
        currentEngineStatus = { status, engine, message };
        statusListeners.forEach(cb => cb(currentEngineStatus));
        return;
      }

      if (id && pendingRequests.has(id)) {
        const { resolve, reject } = pendingRequests.get(id);
        pendingRequests.delete(id);

        if (type === 'PROCESS_SUCCESS' || type === 'SAMPLE_SUCCESS') {
          resolve(result);
        } else if (type === 'ERROR') {
          reject(new Error(error || 'Worker execution failed'));
        } else {
          resolve(result);
        }
      }
    };

    worker.onerror = (err) => {
      currentEngineStatus = {
        status: 'error',
        engine: 'error',
        message: 'Worker failed to boot'
      };
      statusListeners.forEach(cb => cb(currentEngineStatus));
    };
  } catch (err) {
    currentEngineStatus = {
      status: 'error',
      engine: 'error',
      message: err.message
    };
  }

  return worker;
}

export function subscribeWorkerStatus(callback) {
  statusListeners.add(callback);
  callback(currentEngineStatus);
  return () => statusListeners.delete(callback);
}

export function getWorkerStatus() {
  return currentEngineStatus;
}

export function processWithWorker({ format = 'text', content, options = {}, pseudonymMap = {}, counters = {} }) {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'PROCESS',
      payload: { format, content, options, pseudonymMap, counters }
    });

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Processing request timed out'));
      }
    }, 45000);
  });
}

export function processCellsWithWorker({ matrix, options = {}, pseudonymMap = {}, counters = {} }) {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'PROCESS_CELLS',
      payload: { matrix, options, pseudonymMap, counters }
    });

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Cell processing request timed out'));
      }
    }, 45000);
  });
}

export function generateSampleWithWorker(sampleType) {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'GENERATE_SAMPLE',
      payload: { sampleType }
    });

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Sample generation timed out'));
      }
    }, 10000);
  });
}
