import { useState, useCallback } from 'react';
import { useGetAdminUsersQuery } from '@/redux/api/admin/adminApi';

/** Search-filtered list of customers, sorted worst-no-show-first by the API. */
export function useAdminUsersManager() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading, isFetching } = useGetAdminUsersQuery({ search });

  const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(query.trim());
    },
    [query],
  );

  return { users, isLoading: isLoading || isFetching, query, onQueryChange, onSubmit };
}
