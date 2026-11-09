import assert from "node:assert/strict";
import { test } from "node:test";
import { getCachedInitialization } from "../initialization-cache";

test("concurrent requests in the same entity graph share initialization", async () => {
    const cache = new WeakMap<object, Promise<object>>();
    const graph = [class Events {}];
    let calls = 0;
    const initialize = async () => { calls++; return { graph }; };
    const first = getCachedInitialization(cache, graph, initialize);
    const second = getCachedInitialization(cache, graph, initialize);
    assert.equal(first, second);
    assert.equal(await first, await second);
    assert.equal(calls, 1);
});

test("routes and hot reloads with different constructors never share a DataSource", async () => {
    const cache = new WeakMap<object, Promise<{ entities: object[] }>>();
    const home = [class Events {}];
    const api = [class Events {}];
    const reloadedApi = [class Events {}];
    for (const graph of [home, api, reloadedApi, home, api]) {
        const source = await getCachedInitialization(cache, graph, async () => ({ entities: graph }));
        assert.equal(source.entities[0], graph[0]);
    }
    assert.notEqual(await cache.get(home), await cache.get(api));
    assert.notEqual(await cache.get(api), await cache.get(reloadedApi));
});

test("failed initialization can be retried", async () => {
    const cache = new WeakMap<object, Promise<string>>();
    const graph = {};
    await assert.rejects(getCachedInitialization(cache, graph, async () => { throw new Error("connection failed"); }), /connection failed/);
    assert.equal(cache.has(graph), false);
    assert.equal(await getCachedInitialization(cache, graph, async () => "connected"), "connected");
});
