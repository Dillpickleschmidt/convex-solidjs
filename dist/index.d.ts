import * as _solid_primitives_context from '@solid-primitives/context';
import { Accessor } from 'solid-js';
import { ConvexClient, ConvexHttpClient, ConvexClientOptions } from 'convex/browser';
import { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';

type MaybeAccessor<T> = T | Accessor<T>;
declare class ConvexQueryClient {
    client: ConvexClient;
    serverHttpClient?: ConvexHttpClient;
    constructor(url: string, options?: ConvexClientOptions);
    close(): void;
}
declare const ConvexProvider: _solid_primitives_context.ContextProvider<{
    client: ConvexQueryClient;
}>;
declare const useConvexClient: () => ConvexQueryClient | undefined;
declare function setupConvex(url: string, options?: ConvexClientOptions): ConvexQueryClient;
interface QueryOptions<T> {
    enabled?: boolean;
    initialData?: T;
    keepPreviousData?: boolean;
}
interface QueryReturn<T> {
    data: Accessor<T | undefined>;
    error: Accessor<Error | undefined>;
    isLoading: Accessor<boolean>;
    isStale: Accessor<boolean>;
    refetch: () => void;
}
declare function useQuery<Query extends FunctionReference<'query'>>(query: Query, args: MaybeAccessor<FunctionArgs<Query>>, options?: MaybeAccessor<QueryOptions<FunctionReturnType<Query>>>): QueryReturn<FunctionReturnType<Query>>;
interface MutationReturn<TArgs, TResult> {
    mutate: (args: TArgs) => Promise<TResult>;
    mutateAsync: (args: TArgs) => Promise<TResult>;
    data: Accessor<TResult | undefined>;
    error: Accessor<Error | undefined>;
    isLoading: Accessor<boolean>;
    reset: () => void;
}
declare function useMutation<Mutation extends FunctionReference<'mutation'>>(mutation: Mutation): MutationReturn<FunctionArgs<Mutation>, FunctionReturnType<Mutation>>;
declare function useAction<Action extends FunctionReference<'action'>>(action: Action): MutationReturn<FunctionArgs<Action>, FunctionReturnType<Action>>;

export { ConvexProvider, ConvexQueryClient, setupConvex, useAction, useConvexClient, useMutation, useQuery };
