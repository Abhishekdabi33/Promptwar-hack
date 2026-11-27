import { WorkerStatus, SanitizationResult } from '../types';

let worker: Worker | null = null;
let reqCounter = 0;
const pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: Error) => void }>();
const statusListeners = new Set<(status: WorkerStatus) => void>();

let currentEngineStatus: WorkerStatus = {
  status: 'booting',
  engine: 'initializing',
  message: 'Booting Python WASM Worker...'
};

export function initPyodideWorker(): Worker | null {
  if (worker) return worker;

  try {
    worker = new Worker(new URL('../workers/pyodideWorker.js', import.meta.url), {
      type: 'classic'
    });

    worker.onmessage = (e: MessageEvent) => {
      const { id, type, result, status, engine, message, error } = e.data;

      if (type === 'STATUS') {
        currentEngineStatus = { status, engine, message };
        statusListeners.forEach(cb => cb(currentEngineStatus));
        return;
      }

      if (id && pendingRequests.has(id)) {
        const { resolve, reject } = pendingRequests.get(id)!;
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

    worker.onerror = () => {
      currentEngineStatus = {
        status: 'error',
        engine: 'error',
        message: 'Worker failed to boot'
      };
      statusListeners.forEach(cb => cb(currentEngineStatus));
    };
  } catch (err: any) {
    currentEngineStatus = {
      status: 'error',
      engine: 'error',
      message: err?.message || 'Initialization error'
    };
  }

  return worker;
}

export function subscribeWorkerStatus(callback: (status: WorkerStatus) => void): () => void {
  statusListeners.add(callback);
  callback(currentEngineStatus);
  return () => statusListeners.delete(callback);
}

export function getWorkerStatus(): WorkerStatus {
  return currentEngineStatus;
}

interface ProcessPayload {
  format?: string;
  content: string;
  options?: Record<string, any>;
  pseudonymMap?: Record<string, string>;
  counters?: Record<string, number>;
}

export function processWithWorker({
  format = 'text',
  content,
  options = {},
  pseudonymMap = {},
  counters = {}
}: ProcessPayload): Promise<SanitizationResult> {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker?.postMessage({
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

interface ProcessCellsPayload {
  matrix: string[][];
  options?: Record<string, any>;
  pseudonymMap?: Record<string, string>;
  counters?: Record<string, number>;
}

export function processCellsWithWorker({
  matrix,
  options = {},
  pseudonymMap = {},
  counters = {}
}: ProcessCellsPayload): Promise<{ sanitized_matrix: string[][]; matches: any[]; pseudonym_vault: Record<string, string> }> {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker?.postMessage({
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

export function generateSampleWithWorker(sampleType: string): Promise<string> {
  initPyodideWorker();
  const id = `req_${Date.now()}_${++reqCounter}`;

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker?.postMessage({
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
