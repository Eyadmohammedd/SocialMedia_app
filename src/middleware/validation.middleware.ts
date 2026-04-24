import { Request, Response, NextFunction } from "express";
import { BadRequestException } from "../common/exceptions";

type SchemaType = Record<
  string,
  {
    validate: (data: any, options?: any) => { value: any; error?: any };
  }
>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: any[] = [];

    for (const key in schema) {
      const current = schema[key];
      if (!current) continue;

      const { value, error } = current.validate((req as any)[key], {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          key,
          details: (error.details || []).map((ele: any) => ({
            path: ele.path,
            message: ele.message,
          })),
        });
      } else {
        (req as any)[key] = value;
      }
    }

    if (errors.length) {
      return next(new BadRequestException("Validation error", errors));
    }

    next();
  };
};