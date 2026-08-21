import dayjs from "dayjs";

export function formatDate(value: string | Date) {
  return dayjs(value).format("MMM D, YYYY");
}

export function formatTime(value: string | Date) {
  return dayjs(value).format("h:mm A");
}

export function formatDateTimeInput(value: string | Date | undefined | null) {
  // For <input type="datetime-local">, which needs "YYYY-MM-DDTHH:mm" with
  // no timezone suffix.
  return value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";
}
