import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function numberToWords(s) {
  s = Math.floor(Math.abs(s));
  const huruf = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ];
  let temp = "";
  if (s < 12) {
    temp = " " + huruf[s];
  } else if (s < 20) {
    temp = numberToWords(s - 10) + " belas";
  } else if (s < 100) {
    temp = numberToWords(Math.floor(s / 10)) + " puluh" + numberToWords(s % 10);
  } else if (s < 200) {
    temp = " seratus" + numberToWords(s - 100);
  } else if (s < 1000) {
    temp = numberToWords(Math.floor(s / 100)) + " ratus" + numberToWords(s % 100);
  } else if (s < 2000) {
    temp = " seribu" + numberToWords(s - 1000);
  } else if (s < 1000000) {
    temp = numberToWords(Math.floor(s / 1000)) + " ribu" + numberToWords(s % 1000);
  } else if (s < 1000000000) {
    temp = numberToWords(Math.floor(s / 1000000)) + " juta" + numberToWords(s % 1000000);
  } else if (s < 1000000000000) {
    temp = numberToWords(Math.floor(s / 1000000000)) + " milyar" + numberToWords(s % 1000000000);
  } else if (s < 1000000000000000) {
    temp = numberToWords(Math.floor(s / 1000000000000)) + " trilyun" + numberToWords(s % 1000000000000);
  }
  return temp.trim();
}