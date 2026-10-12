import { Prisma } from '@prisma/client';

export type DbErrorKind = 'UNREACHABLE' | 'OTHER';

export interface DbErrorDiagnosis {
  readonly kind: DbErrorKind;
  readonly message: string;
}

const UNREACHABLE_CODE = 'P1001';
const DEFAULT_MESSAGE = 'Error en la conexión a la base de datos de fuentes';

export function diagnoseDbError(error: unknown): DbErrorDiagnosis {
  if (
    error instanceof Prisma.PrismaClientInitializationError &&
    error.errorCode === UNREACHABLE_CODE
  ) {
    return {
      kind: 'UNREACHABLE',
      message:
        'El servidor MySQL local (127.0.0.1:3306) no responde. Asegúrate de iniciar el contenedor con `docker start bx-mysql-dev` o ejecutar `./scripts/dev-up.sh`.',
    };
  }

  if (error instanceof Error) {
    const lines = error.message
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : DEFAULT_MESSAGE;
    return { kind: 'OTHER', message: lastLine };
  }

  return { kind: 'OTHER', message: DEFAULT_MESSAGE };
}
