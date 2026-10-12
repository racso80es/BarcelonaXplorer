import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { diagnoseDbError } from './db-error-diagnosis';

describe('diagnoseDbError (PBI-DEV-001)', () => {
  it('debe clasificar PrismaClientInitializationError con código P1001 como UNREACHABLE con mensaje accionable', () => {
    const error = new Prisma.PrismaClientInitializationError(
      "Can't reach database server at 127.0.0.1:3306\nPlease make sure your database server is running at 127.0.0.1:3306.",
      '5.22.0',
      'P1001'
    );

    const result = diagnoseDbError(error);

    expect(result.kind).toBe('UNREACHABLE');
    expect(result.message).toContain('El servidor MySQL local (127.0.0.1:3306) no responde');
    expect(result.message).toContain('docker start bx-mysql-dev');
  });

  it('debe clasificar PrismaClientInitializationError con código distinto como OTHER y resumir mensaje', () => {
    const error = new Prisma.PrismaClientInitializationError(
      'Authentication failed against database\nAccess denied for user bx_admin',
      '5.22.0',
      'P1000'
    );

    const result = diagnoseDbError(error);

    expect(result.kind).toBe('OTHER');
    expect(result.message).toBe('Access denied for user bx_admin');
  });

  it('debe clasificar PrismaClientKnownRequestError como OTHER extrayendo la última línea significativa', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'The table `barcelonaxplorer_db.context_sources` does not exist in the current database.',
      {
        code: 'P2021',
        clientVersion: '5.22.0',
      }
    );

    const result = diagnoseDbError(error);

    expect(result.kind).toBe('OTHER');
    expect(result.message).toBe(
      'The table `barcelonaxplorer_db.context_sources` does not exist in the current database.'
    );
  });

  it('debe limpiar volcados de código multilínea en Error genérico y retornar la última línea', () => {
    const multilineMessage = `
Invalid \`this.db.contextSource.findMany()\` invocation in /path/to/chunk.js:1335:50
1332 return row;
1333 }
Can't reach database server at 127.0.0.1:3306
    `.trim();

    const error = new Error(multilineMessage);
    const result = diagnoseDbError(error);

    expect(result.kind).toBe('OTHER');
    expect(result.message).toBe("Can't reach database server at 127.0.0.1:3306");
  });

  it('debe retornar mensaje por defecto ante errores que no sean instancias de Error', () => {
    expect(diagnoseDbError(null).kind).toBe('OTHER');
    expect(diagnoseDbError(null).message).toBe('Error en la conexión a la base de datos de fuentes');

    expect(diagnoseDbError(undefined).kind).toBe('OTHER');
    expect(diagnoseDbError('Error de socket string').kind).toBe('OTHER');
  });
});
