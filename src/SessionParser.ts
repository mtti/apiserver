import { Request } from 'express';

export type SessionParser<T = unknown> = (req: Request) => Promise<T>;
