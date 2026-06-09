import dayjs, { type Dayjs } from "dayjs";

export const FORM_DATE_FMT = "YYYY-MM-DD";
export const DOC_DATE_FMT = "YYYYMMDD";

export function formatFormDate(date: Dayjs | string | null | undefined): string {
  if (!date) return "";
  return dayjs(date).format(FORM_DATE_FMT);
}

export function formatDocDate(date: Dayjs | string | null | undefined): string {
  if (!date) return "";
  return dayjs(date).format(DOC_DATE_FMT);
}

export function todayForm(): string {
  return dayjs().format(FORM_DATE_FMT);
}

export function todayDoc(): string {
  return dayjs().format(DOC_DATE_FMT);
}

export function toDayjs(date: string | null | undefined): Dayjs | null {
  return date ? dayjs(date) : null;
}