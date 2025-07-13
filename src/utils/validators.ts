import { z } from 'zod';

export const currencySchema = z.enum(['CZK', 'EUR', 'USD']);

export const orderSchema = z.enum(['asc', 'desc']);

export const dateSchema = z.string().refine((val) => {
  const date = new Date(val);
  return !isNaN(date.getTime());
}, 'Invalid date format');

export const emailSchema = z.string().email();

export const positiveIntSchema = z.number().int().positive();

export function validateCurrency(currency: string): currency is 'CZK' | 'EUR' | 'USD' {
  return ['CZK', 'EUR', 'USD'].includes(currency);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}