/* eslint-disable no-dupe-class-members */
import { assert, isNonNullObject } from "@cosmjs/utils";
import axios, { AxiosError, AxiosInstance } from "axios";

import {
  AuthAccountsResponse,
  BlockResponse,
  BroadcastMode,
  EncodeTxResponse,
  NodeInfoResponse,
  PostTxsResponse,
  SearchTxsResponse,
  TxsResponse,
} from "./lcdapi";
import { CosmosSdkTx, StdTx } from "./types";

/** Unfortunately, Cosmos SDK encodes empty arrays as null */
export type LcdApiArray<T> = readonly T[] | null;

export function normalizeArray<T>(backend: LcdApiArray<T>): readonly T[] {
  return backend || [];
}

export type LcdModule = Record<string, (...args: any[]) => any>;

type LcdModuleSetup<M> = (base: LcdClient) => M;

export interface LcdClientBaseOptions {
  readonly apiUrl: string;
  readonly broadcastMode?: BroadcastMode;
}

// We want to get message data from 500 errors
// https://stackoverflow.com/questions/56577124/how-to-handle-500-error-message-with-axios
// this should be chained to catch one error and throw a more informative one
function parseAxiosError(err: AxiosError): never {
  // use the error message sent from server, not default 500 msg
  if (err.response?.data) {
    let errorText: string;
    const data = err.response.data;
    // expect { error: string }, but otherwise dump
    if (data.error && typeof data.error === "string") {
      errorText = data.error;
    } else if (typeof data === "string") {
      errorText = data;
    } else {
      errorText = JSON.stringify(data);
    }
    throw new Error(`${errorText} (HTTP ${err.response.status})`);
  } else {
    throw err;
  }
}

/**
 * A client to the LCD's (light client daemon) API.
 * This light client connects to Tendermint (i.e. the chain), encodes/decodes Amino data for us and provides a convenient JSON interface.
 *
 * This _JSON over HTTP_ API is sometimes referred to as "REST" or "RPC", which are both misleading terms
 * for the same thing.
 *
 * Please note that the client to the LCD can not verify light client proofs. When using this,
 * you need to trust the API provider as well as the network connection between client and API.
 *
 * @see https://cosmos.network/rpc
 */
export class LcdClient {
  /** Constructs an LCD client with 0 modules */
  public static withModules(options: LcdClientBaseOptions): LcdClient;

  /** Constructs an LCD client with 1 module */
  public static withModules<A extends LcdModule>(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
  ): LcdClient & A;

  /** Constructs an LCD client with 2 modules */
  public static withModules<A extends LcdModule, B extends LcdModule>(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
  ): LcdClient & A & B;

  /** Constructs an LCD client with 3 modules */
  public static withModules<A extends LcdModule, B extends LcdModule, C extends LcdModule>(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
  ): LcdClient & A & B & C;

  /** Constructs an LCD client with 4 modules */
  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
    setupModuleD: LcdModuleSetup<D>,
  ): LcdClient & A & B & C & D;

  /** Constructs an LCD client with 5 modules */
  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule,
    E extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
    setupModuleD: LcdModuleSetup<D>,
    setupModuleE: LcdModuleSetup<E>,
  ): LcdClient & A & B & C & D & E;

  /** Constructs an LCD client with 6 modules */
  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule,
    E extends LcdModule,
    F extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
    setupModuleD: LcdModuleSetup<D>,
    setupModuleE: LcdModuleSetup<E>,
    setupModuleF: LcdModuleSetup<F>,
  ): LcdClient & A & B & C & D & E & F;

  /** Constructs an LCD client with 7 modules */
  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule,
    E extends LcdModule,
    F extends LcdModule,
    G extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
    setupModuleD: LcdModuleSetup<D>,
    setupModuleE: LcdModuleSetup<E>,
    setupModuleF: LcdModuleSetup<F>,
    setupModuleG: LcdModuleSetup<G>,
  ): LcdClient & A & B & C & D & E & F & G;

  /** Constructs an LCD client with 8 modules */
  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule,
    E extends LcdModule,
    F extends LcdModule,
    G extends LcdModule,
    H extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA: LcdModuleSetup<A>,
    setupModuleB: LcdModuleSetup<B>,
    setupModuleC: LcdModuleSetup<C>,
    setupModuleD: LcdModuleSetup<D>,
    setupModuleE: LcdModuleSetup<E>,
    setupModuleF: LcdModuleSetup<F>,
    setupModuleG: LcdModuleSetup<G>,
    setupModuleH: LcdModuleSetup<H>,
  ): LcdClient & A & B & C & D & E & F & G & H;

  public static withModules<
    A extends LcdModule,
    B extends LcdModule,
    C extends LcdModule,
    D extends LcdModule,
    E extends LcdModule,
    F extends LcdModule,
    G extends LcdModule,
    H extends LcdModule
  >(
    options: LcdClientBaseOptions,
    setupModuleA?: LcdModuleSetup<A>,
    setupModuleB?: LcdModuleSetup<B>,
    setupModuleC?: LcdModuleSetup<C>,
    setupModuleD?: LcdModuleSetup<D>,
    setupModuleE?: LcdModuleSetup<E>,
    setupModuleF?: LcdModuleSetup<F>,
    setupModuleG?: LcdModuleSetup<G>,
    setupModuleH?: LcdModuleSetup<H>,
  ): any {
    const client = new LcdClient(options.apiUrl, options.broadcastMode);

    const modules = new Array<LcdModule>();
    if (setupModuleA) modules.push(setupModuleA(client));
    if (setupModuleB) modules.push(setupModuleB(client));
    if (setupModuleC) modules.push(setupModuleC(client));
    if (setupModuleD) modules.push(setupModuleD(client));
    if (setupModuleE) modules.push(setupModuleE(client));
    if (setupModuleF) modules.push(setupModuleF(client));
    if (setupModuleG) modules.push(setupModuleG(client));
    if (setupModuleH) modules.push(setupModuleH(client));
    for (const module of modules) {
      assert(isNonNullObject(module), `Module must be a non-null object`);
      for (const key in module) {
        assert(typeof key == "string", `Found non-string module key: ${key}`);
        (client as any)[key] = module[key];
      }
    }

    return client;
  }

  private readonly client: AxiosInstance;
  private readonly broadcastMode: BroadcastMode;

  /**
   * Creates a new client to interact with a Cosmos SDK light client daemon.
   * This class tries to be a direct mapping onto the API. Some basic decoding and normalizatin is done
   * but things like caching are done at a higher level.
   *
   * When building apps, you should not need to use this class directly. If you do, this indicates a missing feature
   * in higher level components. Feel free to raise an issue in this case.
   *
   * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
   * @param broadcastMode Defines at which point of the transaction processing the postTx method (i.e. transaction broadcasting) returns
   */
  public constructor(apiUrl: string, broadcastMode = BroadcastMode.Block) {
    const headers = {
      post: { "Content-Type": "application/json" },
    };
    this.client = axios.create({
      baseURL: apiUrl,
      headers: headers,
    });
    this.broadcastMode = broadcastMode;
  }

  public async get(path: string): Promise<any> {
    const { data } = await this.client.get(path).catch(parseAxiosError);
    if (data === null) {
      throw new Error("Received null response from server");
    }
    return data;
  }

  public async post(path: string, params: any): Promise<any> {
    if (!isNonNullObject(params)) throw new Error("Got unexpected type of params. Expected object.");
    const { data } = await this.client.post(path, params).catch(parseAxiosError);
    if (data === null) {
      throw new Error("Received null response from server");
    }
    return data;
  }

  // The /auth endpoints

  public async authAccounts(address: string): Promise<AuthAccountsResponse> {
    const path = `/auth/accounts/${address}`;
    const responseData = await this.get(path);
    if (responseData.result.type !== "cosmos-sdk/Account") {
      throw new Error("Unexpected response data format");
    }
    return responseData as AuthAccountsResponse;
  }

  // The /blocks endpoints

  public async blocksLatest(): Promise<BlockResponse> {
    const responseData = await this.get("/blocks/latest");
    if (!responseData.block) {
      throw new Error("Unexpected response data format");
    }
    return responseData as BlockResponse;
  }

  public async blocks(height: number): Promise<BlockResponse> {
    const responseData = await this.get(`/blocks/${height}`);
    if (!responseData.block) {
      throw new Error("Unexpected response data format");
    }
    return responseData as BlockResponse;
  }

  // The /node_info endpoint

  public async nodeInfo(): Promise<NodeInfoResponse> {
    const responseData = await this.get("/node_info");
    if (!responseData.node_info) {
      throw new Error("Unexpected response data format");
    }
    return responseData as NodeInfoResponse;
  }

  // The /txs endpoints

  public async txById(id: string): Promise<TxsResponse> {
    const responseData = await this.get(`/txs/${id}`);
    if (!responseData.tx) {
      throw new Error("Unexpected response data format");
    }
    return responseData as TxsResponse;
  }

  public async txsQuery(query: string): Promise<SearchTxsResponse> {
    const responseData = await this.get(`/txs?${query}`);
    if (!responseData.txs) {
      throw new Error("Unexpected response data format");
    }
    return responseData as SearchTxsResponse;
  }

  /** returns the amino-encoding of the transaction performed by the server */
  public async encodeTx(tx: CosmosSdkTx): Promise<EncodeTxResponse> {
    const responseData = await this.post("/txs/encode", tx);
    if (!responseData.tx) {
      throw new Error("Unexpected response data format");
    }
    return responseData as EncodeTxResponse;
  }

  /**
   * Broadcasts a signed transaction to into the transaction pool.
   * Depending on the RestClient's broadcast mode, this might or might
   * wait for checkTx or deliverTx to be executed before returning.
   *
   * @param tx a signed transaction as StdTx (i.e. not wrapped in type/value container)
   */
  public async postTx(tx: StdTx): Promise<PostTxsResponse> {
    const params = {
      tx: tx,
      mode: this.broadcastMode,
    };
    const responseData = await this.post("/txs", params);
    if (!responseData.txhash) {
      throw new Error("Unexpected response data format");
    }
    return responseData as PostTxsResponse;
  }
}
