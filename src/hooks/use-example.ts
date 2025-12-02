// Example hook using React Query
import { useQuery } from '@tanstack/react-query'

export function useExample() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Fetch data here
      return { data: 'example' }
    },
  })
}
