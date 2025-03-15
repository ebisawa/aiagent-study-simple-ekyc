import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TailwindとclsxとtwMergeを組み合わせたユーティリティ関数
 * クラス名を条件付きで結合し、Tailwindのクラス名の衝突を解決します
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 