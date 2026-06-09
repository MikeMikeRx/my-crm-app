import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const dateString = z.string().regex(DATE_REGEX, "Invalid date");
export const optionalDateString = z.string().regex(DATE_REGEX, "Invalid date").optional();
