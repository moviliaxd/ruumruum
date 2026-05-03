'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Expense, uploadFile } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useExpenses(tripId?: string) {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (tripId) query = query.eq('trip_id', tripId);
    const { data } = await query;
    setExpenses((data ?? []) as Expense[]);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { if (profile) fetchExpenses(); }, [profile, fetchExpenses]);

  const createExpense = async (
    data: Omit<Expense, 'id' | 'created_at' | 'driver_email'>,
    receiptFile?: File
  ) => {
    let receipt_url: string | undefined;
    if (receiptFile) receipt_url = await uploadFile(receiptFile, 'receipts');
    const { error } = await supabase.from('expenses').insert({
      ...data,
      receipt_url,
      driver_email: profile?.email,
      expense_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    await fetchExpenses();
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return { expenses, loading, createExpense, totalExpenses, refetch: fetchExpenses };
}
