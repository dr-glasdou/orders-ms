import 'dotenv/config';
import * as Joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  PRODUCTS_MS_PORT: number;
  PRODUCTS_MS_HOST: string;
}

const envSchema = Joi.object({
  PORT: Joi.number().required(),
  DATABASE_URL: Joi.string().required(),
  PRODUCTS_MS_PORT: Joi.number().required(),
  PRODUCTS_MS_HOST: Joi.string().required(),
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  productsMsPort: envVars.PRODUCTS_MS_PORT,
  productsMsHost: envVars.PRODUCTS_MS_HOST,
};
