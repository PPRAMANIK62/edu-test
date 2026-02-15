import { useQuery } from "@tanstack/react-query";

import { STALE_TIMES } from "@/lib/query-keys";

/** Creates a typed useQuery hook that auto-disables when any arg is undefined/null/empty. */
export function createQueryHook<TData, TArgs extends unknown[]>(
  queryKeyFn: (...args: TArgs) => readonly unknown[],
  queryFn: (...args: TArgs) => Promise<TData>,
  options?: {
    staleTime?: number;
  },
) {
  return (...args: { [K in keyof TArgs]: TArgs[K] | undefined }) => {
    const allDefined = args.every(
      (arg) => arg !== undefined && arg !== null && arg !== "",
    );
    return useQuery({
      queryKey: queryKeyFn(...(args as TArgs)),
      queryFn: () => queryFn(...(args as TArgs)),
      enabled: allDefined,
      staleTime: options?.staleTime ?? STALE_TIMES.STATIC,
    });
  };
}
