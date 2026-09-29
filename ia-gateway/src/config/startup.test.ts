import { describe, expect, it } from 'vitest';
import { assertStartupConfig } from './startup.js';

describe('IA Gateway Fail-Closed Startup Validation (PBI-GW-012)', () => {
  const validSecret32 = '12345678901234567890123456789012'; // Exactly 32 chars
  const validSecret64 = 'fd1e880e4bf5a042de70b32ef3ca12dfb9cd5372e0a5097ec5a87f0cabef0151';

  it('CA-1: rechaza arranque si IA_GATEWAY_SECRET está ausente', () => {
    expect(() => assertStartupConfig({})).toThrowError(/IA_GATEWAY_SECRET no está definida o tiene menos de 32 caracteres/);
  });

  it('CA-1: rechaza arranque si IA_GATEWAY_SECRET tiene 31 caracteres (umbral estricto 32)', () => {
    const secret31 = '1234567890123456789012345678901';
    expect(() =>
      assertStartupConfig({
        IA_GATEWAY_SECRET: secret31,
      })
    ).toThrowError(/IA_GATEWAY_SECRET no está definida o tiene menos de 32 caracteres/);
  });

  it('CA-1: acepta arranque con secreto válido de 32 caracteres', () => {
    const config = assertStartupConfig({
      IA_GATEWAY_SECRET: validSecret32,
    });
    expect(config.gatewaySecret).toBe(validSecret32);
    expect(config.port).toBe(3001);
  });

  it('CA-1: acepta arranque con secreto válido de 64 caracteres hex', () => {
    const config = assertStartupConfig({
      IA_GATEWAY_SECRET: validSecret64,
      PORT: '3005',
    });
    expect(config.gatewaySecret).toBe(validSecret64);
    expect(config.port).toBe(3005);
  });

  it('CA-3: rechaza arranque si DEFAULT_FAST_LLM comparte proveedor GROQ con el principal', () => {
    expect(() =>
      assertStartupConfig({
        IA_GATEWAY_SECRET: validSecret32,
        DEFAULT_FAST_LLM: 'groq:llama-3.3-70b-versatile',
      })
    ).toThrowError(/DEFAULT_FAST_LLM comparte proveedor \(GROQ\)/);
  });

  it('CA-3: rechaza arranque si DEFAULT_REASONING_LLM comparte proveedor GOOGLE con el principal', () => {
    expect(() =>
      assertStartupConfig({
        IA_GATEWAY_SECRET: validSecret32,
        DEFAULT_REASONING_LLM: 'google:gemini-2.5-flash',
      })
    ).toThrowError(/DEFAULT_REASONING_LLM comparte proveedor \(GOOGLE\)/);
  });
});
