'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, DriverDocument, uploadFile } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useDocuments() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('driver_documents')
      .select('*')
      .order('created_at', { ascending: false });
    setDocuments((data ?? []) as DriverDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (profile) fetchDocuments(); }, [profile, fetchDocuments]);

  const uploadDocument = async (
    file: File,
    document_type: DriverDocument['document_type'],
    document_name: string,
    expiry_date?: string
  ) => {
    const file_url = await uploadFile(file, 'documents');
    const { error } = await supabase.from('driver_documents').insert({
      document_type, document_name, file_url,
      expiry_date, driver_email: profile?.email, status: 'pending',
    });
    if (error) throw new Error(error.message);
    await fetchDocuments();
  };

  return { documents, loading, uploadDocument, refetch: fetchDocuments };
}
