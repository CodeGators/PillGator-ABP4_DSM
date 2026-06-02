import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';

import { AutenticacaoProvider } from './AutenticacaoContexto';
import { PacienteSelecionadoProvider } from './PacienteSelecionadoContexto';

export function ProvedoresApp({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AutenticacaoProvider>
        <PacienteSelecionadoProvider>{children}</PacienteSelecionadoProvider>
      </AutenticacaoProvider>
    </QueryClientProvider>
  );
}
