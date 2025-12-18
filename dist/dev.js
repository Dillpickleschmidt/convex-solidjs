import { onCleanup, createMemo, createSignal, createResource, createEffect, on, batch } from 'solid-js';
import { isServer } from 'solid-js/web';
import { createContextProvider } from '@solid-primitives/context';
import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import { getFunctionName } from 'convex/server';

// src/index.tsx
function resolve(value) {
  return typeof value === "function" ? value() : value;
}
var ConvexQueryClient = class {
  constructor(url, options) {
    if (!url || typeof url !== "string") {
      throw new Error("ConvexQueryClient requires a valid URL string");
    }
    this.client = new ConvexClient(url, {
      disabled: isServer,
      ...options
    });
    if (isServer) {
      this.serverHttpClient = new ConvexHttpClient(url);
    }
  }
  close() {
    this.client.close();
  }
};
var [ConvexProvider, useConvexClient] = createContextProvider((props) => {
  return props.client;
});
function setupConvex(url, options) {
  const convexQueryClient = new ConvexQueryClient(url, options);
  onCleanup(() => convexQueryClient.close());
  return convexQueryClient;
}
function useQuery(query, args, options) {
  const convexQueryClient = useConvexClient();
  if (!convexQueryClient) {
    throw new Error("useQuery must be used within ConvexProvider");
  }
  const client = convexQueryClient.client;
  const httpClient = convexQueryClient.serverHttpClient;
  const getArgs = createMemo(() => resolve(args));
  const getOptions = createMemo(() => resolve(options ?? {}));
  const [liveData, setLiveData] = createSignal();
  const [liveError, setLiveError] = createSignal();
  const [hasReceivedData, setHasReceivedData] = createSignal(false);
  const [resource, {
    refetch
  }] = createResource(() => {
    const opts = getOptions();
    if (opts.enabled === false) return null;
    return {
      args: getArgs()
    };
  }, async (source) => {
    const opts = getOptions();
    if (isServer && opts.initialData !== void 0) {
      return opts.initialData;
    }
    if (isServer && httpClient) {
      return await httpClient.query(query, source.args);
    }
    try {
      const result = client.client.localQueryResult(getFunctionName(query), source.args);
      if (result !== void 0) return result;
    } catch {
    }
    if (opts.initialData !== void 0 && !hasReceivedData()) {
      return opts.initialData;
    }
    return await client.query(query, source.args);
  });
  createEffect(on([getArgs, () => getOptions().enabled], ([args2, enabled]) => {
    if (enabled === false) return;
    const unsubscribe = client.onUpdate(query, args2, (data2) => {
      batch(() => {
        setLiveData(() => data2);
        setLiveError(void 0);
        setHasReceivedData(true);
      });
    }, (error2) => {
      batch(() => {
        setLiveError(() => error2);
        setLiveData(void 0);
        setHasReceivedData(true);
      });
    });
    onCleanup(unsubscribe);
  }));
  const data = createMemo(() => {
    const live = liveData();
    if (live !== void 0) return live;
    const opts = getOptions();
    if (opts.keepPreviousData && resource.latest) {
      return resource.latest;
    }
    return resource();
  });
  const error = createMemo(() => liveError() ?? resource.error);
  const isLoading = createMemo(() => resource.loading && liveData() === void 0);
  const isStale = createMemo(() => Boolean(getOptions().keepPreviousData && resource.loading && resource.latest && data() === resource.latest));
  return {
    data,
    error,
    isLoading,
    isStale,
    refetch
  };
}
function useMutation(mutation) {
  const convexQueryClient = useConvexClient();
  if (!convexQueryClient) {
    throw new Error("useMutation must be used within ConvexProvider");
  }
  const client = convexQueryClient.client;
  const [state, setState] = createSignal({
    isLoading: false
  });
  const mutateAsync = async (args) => {
    setState({
      isLoading: true
    });
    try {
      const result = await client.mutation(mutation, args);
      setState({
        data: result,
        isLoading: false
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        error: err,
        isLoading: false
      });
      throw err;
    }
  };
  const reset = () => setState({
    isLoading: false
  });
  return {
    mutate: mutateAsync,
    mutateAsync,
    data: () => state().data,
    error: () => state().error,
    isLoading: () => state().isLoading,
    reset
  };
}
function useAction(action) {
  const convexQueryClient = useConvexClient();
  if (!convexQueryClient) {
    throw new Error("useAction must be used within ConvexProvider");
  }
  const client = convexQueryClient.client;
  const [state, setState] = createSignal({
    isLoading: false
  });
  const executeAsync = async (args) => {
    setState({
      isLoading: true
    });
    try {
      const result = await client.action(action, args);
      setState({
        data: result,
        isLoading: false
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        error: err,
        isLoading: false
      });
      throw err;
    }
  };
  const reset = () => setState({
    isLoading: false
  });
  return {
    mutate: executeAsync,
    mutateAsync: executeAsync,
    data: () => state().data,
    error: () => state().error,
    isLoading: () => state().isLoading,
    reset
  };
}

export { ConvexProvider, ConvexQueryClient, setupConvex, useAction, useConvexClient, useMutation, useQuery };
