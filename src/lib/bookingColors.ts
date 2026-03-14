const BOOKING_COLORS = [
  { bg: "bg-booking-1", text: "text-purple-800", border: "border-purple-300" },
  { bg: "bg-booking-2", text: "text-teal-800", border: "border-teal-300" },
  { bg: "bg-booking-3", text: "text-orange-800", border: "border-orange-300" },
  { bg: "bg-booking-4", text: "text-blue-800", border: "border-blue-300" },
  { bg: "bg-booking-5", text: "text-pink-800", border: "border-pink-300" },
  { bg: "bg-booking-6", text: "text-amber-800", border: "border-amber-300" },
  { bg: "bg-booking-7", text: "text-emerald-800", border: "border-emerald-300" },
  { bg: "bg-booking-8", text: "text-indigo-800", border: "border-indigo-300" },
];

export function getBookingColor(index: number) {
  return BOOKING_COLORS[index % BOOKING_COLORS.length];
}

export function abbreviateName(fullName: string): string {
  const parts = fullName.split(" ");
  if (parts.length <= 1) return fullName;
  const first = parts[0];
  const rest = parts.slice(1).map((p) => p[0] + ".").join("");
  return `${first} ${rest}`;
}
