import { describe, expect, it } from 'vitest';
import { TefiChainError, classifyChainError } from './anchorClient';

// Textos tal como los devuelven web3.js y el nodo RPC de devnet
const RATE_LIMIT_HTTP2 = '429 : {"jsonrpc":"2.0","error":{"code": 429, "message":"Connection rate limits exceeded"}, "id": "41e5651f" }';
const RATE_LIMIT_HTTP1 = '429 Too Many Requests: {"jsonrpc":"2.0","error":{"code": 429, "message":"Too many requests for a specific RPC call"}}';
const simulation = (reason: string) => `Simulation failed. \nMessage: Transaction simulation failed: ${reason}. \nLogs: \n[]`;

describe('classifyChainError', () => {
  it('recognises the rate limit of the RPC node, with or without an HTTP status text', () => {
    expect(classifyChainError(new Error(RATE_LIMIT_HTTP2)).code).toBe('RATE_LIMITED');
    expect(classifyChainError(new Error(RATE_LIMIT_HTTP1)).code).toBe('RATE_LIMITED');
  });

  it('does not mistake a number inside program logs for a rate limit', () => {
    const detail = simulation('Error processing Instruction 0: Program failed to complete; consumed 4290 of 200000 compute units');
    expect(classifyChainError(new Error(detail)).code).toBe('UNKNOWN');
  });

  it('tells a QR that was already used apart from an expired one', () => {
    expect(classifyChainError(new Error(simulation('This transaction has already been processed'))).code).toBe('ALREADY_SENT');
    expect(classifyChainError(new Error(simulation('Blockhash not found'))).code).toBe('EXPIRED');
  });

  it('treats an account that already exists as a request that went stale', () => {
    const detail = simulation('Error processing Instruction 1: custom program error: 0x0');
    expect(classifyChainError(new Error(detail)).code).toBe('STALE');
  });

  it('maps the errors of the Tefi program to their code', () => {
    const detail = simulation('Error processing Instruction 0: custom program error: 0x1770');
    const classified = classifyChainError(new Error(detail));
    expect(classified.code).toBe('PROGRAM');
    expect(classified.programCode).toBe(6000);
    expect(classified.detail.length).toBeGreaterThan(0);
  });

  it('recognises a store wallet without SOL', () => {
    expect(classifyChainError(new Error(simulation('Attempt to debit an account but found no record of a prior credit'))).code).toBe('INSUFFICIENT_SOL');
    expect(classifyChainError(new Error('Transfer: insufficient lamports 0, need 1461600')).code).toBe('INSUFFICIENT_SOL');
  });

  it('recognises a device without connection in Chrome, Firefox and Safari', () => {
    expect(classifyChainError(new TypeError('Failed to fetch')).code).toBe('NETWORK');
    expect(classifyChainError(new TypeError('NetworkError when attempting to fetch resource.')).code).toBe('NETWORK');
    expect(classifyChainError(new TypeError('Load failed')).code).toBe('NETWORK');
  });

  it('keeps the code of errors raised by this client', () => {
    expect(classifyChainError(new TefiChainError('EXPIRED', 'not confirmed in time'))).toEqual({ code: 'EXPIRED', detail: 'not confirmed in time' });
  });
});
