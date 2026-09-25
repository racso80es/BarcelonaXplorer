import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaTelemetryRepository } from '@/features/telemetry';
import { PruneTelemetryUseCase } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';
import { TelemetryLogInputSchema } from '@/infrastructure/ai/schemas/telemetry.schema';
import * as fs from 'fs';
import * as path from 'path';

describe('Auditoría Integral del Órgano Sensorial y Telemetría Centralizada', () => {
  let prisma: PrismaClient;
  let repository: PrismaTelemetryRepository;

  beforeAll(async () => {
    // Cargar DATABASE_URL desde .env.local si no está en process.env
    if (!process.env.DATABASE_URL) {
      const envPath = path.resolve(__dirname, '../../src/.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (match) {
          process.env.DATABASE_URL = match[1];
        }
      }
    }

    prisma = new PrismaClient();
    repository = new PrismaTelemetryRepository(prisma);
  });

  afterAll(async () => {
    // Limpieza de registros de prueba generados durante la auditoría
    await prisma.telemetryLog.deleteMany({
      where: {
        message: {
          contains: '[AUDIT_TEST]',
        },
      },
    });
    await prisma.$disconnect();
  });

  it('1. Bóveda MySQL: Inserción directa, consulta e integridad de datos polimórficos', async () => {
    const testMessage = `[AUDIT_TEST] Verificación sensorial ${Date.now()}`;
    const entry = new TelemetryEntry(
      'INFO',
      'SYSTEM',
      testMessage,
      {
        sensor: 'MySQL_Core',
        version: '1.0',
        metrics: { cpu: '12%', memory: '256MB' },
      },
      200,
      15,
      'test-audit',
    );

    await repository.log(entry);

    // Consulta directa en la tabla real de MySQL
    const saved = await prisma.telemetryLog.findFirst({
      where: { message: testMessage },
    });

    expect(saved).not.toBeNull();
    expect(saved?.level).toBe('INFO');
    expect(saved?.context).toBe('SYSTEM');
    expect(saved?.statusCode).toBe(200);
    expect(saved?.durationMs).toBe(15);
    expect(saved?.environment).toBe('test-audit');
    expect((saved?.payload as any)?.sensor).toBe('MySQL_Core');
    expect((saved?.payload as any)?.metrics?.cpu).toBe('12%');
  });

  it('2. Blindaje Anti-Fugas: Sanitización estricta de credenciales en el payload', async () => {
    const testMessage = `[AUDIT_TEST] Test Sanitización ${Date.now()}`;
    const entry = new TelemetryEntry(
      'WARN',
      'SECURITY_PERIMETER',
      testMessage,
      {
        username: 'operador_admin',
        password: 'contraseña_super_secreta',
        authorization: 'Basic cmFjc286cGFzc3dvcmQ=',
        token: 'jwt.bearer.secret_token',
        nested: {
          apiKey: 'AIzaSySecretKey123',
          normalData: 'informacion_legitima',
        },
      },
      401,
      5,
    );

    await repository.log(entry);

    const saved = await prisma.telemetryLog.findFirst({
      where: { message: testMessage },
    });

    expect(saved).not.toBeNull();
    const payload = saved?.payload as any;

    expect(payload.username).toBe('operador_admin');
    expect(payload.password).toBe('[REDACTED]');
    expect(payload.authorization).toBe('[REDACTED]');
    expect(payload.token).toBe('[REDACTED]');
    expect(payload.nested.apiKey).toBe('[REDACTED]');
    expect(payload.nested.normalData).toBe('informacion_legitima');
  });

  it('3. Poda Ontológica Real: Eliminación selectiva por antigüedad y severidad', async () => {
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000);

    // Insertar lote histórico de prueba
    const oldInfo = await prisma.telemetryLog.create({
      data: {
        createdAt: tenDaysAgo,
        level: 'INFO',
        context: 'LLM_ENGINE',
        message: '[AUDIT_TEST] Log INFO caducado (10d)',
      },
    });

    const freshInfo = await prisma.telemetryLog.create({
      data: {
        createdAt: twoDaysAgo,
        level: 'INFO',
        context: 'LLM_ENGINE',
        message: '[AUDIT_TEST] Log INFO vigente (2d)',
      },
    });

    const oldError = await prisma.telemetryLog.create({
      data: {
        createdAt: fortyDaysAgo,
        level: 'ERROR',
        context: 'SERVER_API',
        message: '[AUDIT_TEST] Log ERROR caducado (40d)',
      },
    });

    const freshError = await prisma.telemetryLog.create({
      data: {
        createdAt: fifteenDaysAgo,
        level: 'ERROR',
        context: 'SERVER_API',
        message: '[AUDIT_TEST] Log ERROR vigente (15d)',
      },
    });

    // Ejecutar Poda Ontológica
    const pruneUseCase = new PruneTelemetryUseCase(repository);
    const pruneResult = await pruneUseCase.execute({
      debugInfoMaxAgeDays: 7,
      warnErrorMaxAgeDays: 30,
    });

    expect(pruneResult.deletedCount).toBeGreaterThanOrEqual(2);

    // Verificar que los caducados han sido purgados
    const checkOldInfo = await prisma.telemetryLog.findUnique({ where: { id: oldInfo.id } });
    const checkOldError = await prisma.telemetryLog.findUnique({ where: { id: oldError.id } });
    expect(checkOldInfo).toBeNull();
    expect(checkOldError).toBeNull();

    // Verificar que los vigentes se mantienen intactos
    const checkFreshInfo = await prisma.telemetryLog.findUnique({ where: { id: freshInfo.id } });
    const checkFreshError = await prisma.telemetryLog.findUnique({ where: { id: freshError.id } });
    expect(checkFreshInfo).not.toBeNull();
    expect(checkFreshError).not.toBeNull();
  });

  it('4. Escudo Zod: Triaje entrópico riguroso de eventos', () => {
    // Payload legítimo
    const valid = TelemetryLogInputSchema.safeParse({
      level: 'WARN',
      context: 'SECURITY_PERIMETER',
      message: 'Intento de acceso no autorizado',
      payload: { ip: '127.0.0.1' },
      statusCode: 401,
    });
    expect(valid.success).toBe(true);

    // Contexto inexistente o corrompido
    const invalidContext = TelemetryLogInputSchema.safeParse({
      level: 'INFO',
      context: 'INVENTED_CONTEXT',
      message: 'Mensaje de prueba',
    });
    expect(invalidContext.success).toBe(false);

    // Mensaje vacío
    const emptyMessage = TelemetryLogInputSchema.safeParse({
      level: 'ERROR',
      context: 'CLIENT_UI',
      message: '',
    });
    expect(emptyMessage.success).toBe(false);
  });

  it('5. Auditoría de Frontera Edge: middleware.ts libre de Prisma y de módulos C++', () => {
    const middlewarePath = path.resolve(__dirname, '../../src/middleware.ts');
    const middlewareCode = fs.readFileSync(middlewarePath, 'utf8');

    // Comprobación de que no importa Prisma
    expect(middlewareCode).not.toContain('@prisma/client');
    expect(middlewareCode).not.toContain('PrismaClient');

    // Comprobación de que no importa crypto de Node (debe usar Web Crypto API crypto.subtle)
    expect(middlewareCode).not.toMatch(/import .* from ['"]crypto['"]/);

    // Comprobación de que despacha telemetría hacia /api/telemetry/log
    expect(middlewareCode).toContain('/api/telemetry/log');
    expect(middlewareCode).toContain('SECURITY_PERIMETER');
  });

  it('6. Principio Fail-Safe: Resiliencia ante desconexión de MySQL sin derribar el proceso', async () => {
    // Instanciar un repositorio con cliente roto
    const brokenPrisma = {
      telemetryLog: {
        create: () => Promise.reject(new Error('Connection timeout to MySQL 10.0.10.11')),
      },
    } as unknown as PrismaClient;

    const failSafeRepo = new PrismaTelemetryRepository(brokenPrisma);
    const entry = new TelemetryEntry('ERROR', 'SYSTEM', '[AUDIT_TEST] Fallo simulado');

    // No debe lanzar excepción
    await expect(failSafeRepo.log(entry)).resolves.not.toThrow();
  });
});
