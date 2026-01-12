/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter } from "react-router-dom";

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProviderOptions {
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

interface AllTheProvidersProps {
  children: ReactNode;
  options?: TestProviderOptions;
  queryClient?: QueryClient;
}

// Wrapper component with all providers
function AllTheProviders({
  children,
  options = {},
  queryClient,
}: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient();
  const { initialRoute = "/", useMemoryRouter = false } = options;

  const Router = useMemoryRouter ? MemoryRouter : BrowserRouter;
  const routerProps = useMemoryRouter ? { initialEntries: [initialRoute] } : {};

  return (
    <QueryClientProvider client={client}>
      <Router {...routerProps}>{children}</Router>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  providerOptions?: TestProviderOptions;
  queryClient?: QueryClient;
}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  { providerOptions, queryClient, ...renderOptions }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={providerOptions} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";

// Override render export with our custom render
export { customRender as render, createTestQueryClient };
