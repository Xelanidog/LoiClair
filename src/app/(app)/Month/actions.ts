"use server";

import { fetchMonthData } from './page';
import { getLocale, getTranslations } from 'next-intl/server';
import type { MonthData } from './page';

export async function loadMonthAction(monthKey: string): Promise<MonthData> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('month')]);
  return fetchMonthData(monthKey, locale, t('lawFullyApplied'));
}
