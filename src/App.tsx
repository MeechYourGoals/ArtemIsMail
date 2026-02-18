import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaveTripButton } from '@/components/LeaveTripButton';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-950">
        <h1 className="text-xl font-semibold">Chravel</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Trip Persistence: Use LeaveTripButton in trip settings/sidebar.
        </p>
        <div className="mt-4">
          <LeaveTripButton tripId="demo-trip-id" tripName="Demo Trip" />
        </div>
      </div>
    </QueryClientProvider>
  );
}
