"use server";

import { fetchMonthData } from './page';
import type { MonthData } from './page';

export async function loadMonthAction(monthKey: string): Promise<MonthData> {
  return fetchMonthData(monthKey);
}
