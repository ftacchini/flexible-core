import "jasmine";
import { MemoryRateLimitStore } from "../../../src";

describe("MemoryRateLimitStore", () => {
    let store: MemoryRateLimitStore;

    beforeEach(() => {
        store = new MemoryRateLimitStore();
    });

    afterEach(() => {
        store.clear();
    });

    describe("increment()", () => {
        it("should create new entry on first increment", async () => {
            const info = await store.increment("client1", 60000);

            expect(info.count).toBe(1);
            expect(info.windowStart).toBeLessThanOrEqual(Date.now());
            expect(info.resetTime).toBeGreaterThan(Date.now());
        });

        it("should increment count in same window", async () => {
            await store.increment("client1", 60000);
            const info = await store.increment("client1", 60000);

            expect(info.count).toBe(2);
        });

        it("should track multiple clients independently", async () => {
            const info1 = await store.increment("client1", 60000);
            const info2 = await store.increment("client2", 60000);

            expect(info1.count).toBe(1);
            expect(info2.count).toBe(1);
        });

        it("should reset count after window expires", async () => {
            const info1 = await store.increment("client1", 100);

            await new Promise(resolve => setTimeout(resolve, 150));

            const info2 = await store.increment("client1", 100);
            expect(info2.count).toBe(1);
        });

        it("should set correct reset time", async () => {
            const windowMs = 60000;
            const before = Date.now();
            const info = await store.increment("client1", windowMs);
            const after = Date.now();

            expect(info.resetTime).toBeGreaterThanOrEqual(before + windowMs);
            expect(info.resetTime).toBeLessThanOrEqual(after + windowMs);
        });
    });

    describe("get()", () => {
        it("should return null for non-existent key", async () => {
            const info = await store.get("nonexistent");
            expect(info).toBeNull();
        });

        it("should return info for existing key", async () => {
            await store.increment("client1", 60000);
            const info = await store.get("client1");

            expect(info).not.toBeNull();
            expect(info!.count).toBe(1);
        });

        it("should return null for expired entry", async () => {
            await store.increment("client1", 100);

            await new Promise(resolve => setTimeout(resolve, 150));

            const info = await store.get("client1");
            expect(info).toBeNull();
        });

        it("should delete expired entry on get", async () => {
            await store.increment("client1", 100);
            expect(store.size()).toBe(1);

            await new Promise(resolve => setTimeout(resolve, 150));

            await store.get("client1");
            expect(store.size()).toBe(0);
        });
    });

    describe("reset()", () => {
        it("should remove entry", async () => {
            await store.increment("client1", 60000);
            expect(store.size()).toBe(1);

            await store.reset("client1");
            expect(store.size()).toBe(0);
        });

        it("should not throw for non-existent key", async () => {
            await expectAsync(store.reset("nonexistent")).toBeResolved();
        });

        it("should allow new entry after reset", async () => {
            await store.increment("client1", 60000);
            await store.increment("client1", 60000);

            await store.reset("client1");

            const info = await store.increment("client1", 60000);
            expect(info.count).toBe(1);
        });
    });

    describe("cleanup()", () => {
        it("should remove expired entries", async () => {
            await store.increment("client1", 100);
            await store.increment("client2", 100);
            await store.increment("client3", 60000);

            expect(store.size()).toBe(3);

            await new Promise(resolve => setTimeout(resolve, 150));

            await store.cleanup();

            expect(store.size()).toBe(1);
            const info = await store.get("client3");
            expect(info).not.toBeNull();
        });

        it("should not remove active entries", async () => {
            await store.increment("client1", 60000);
            await store.increment("client2", 60000);

            await store.cleanup();

            expect(store.size()).toBe(2);
        });

        it("should handle empty store", async () => {
            await expectAsync(store.cleanup()).toBeResolved();
            expect(store.size()).toBe(0);
        });
    });

    describe("size()", () => {
        it("should return 0 for empty store", () => {
            expect(store.size()).toBe(0);
        });

        it("should return correct count", async () => {
            await store.increment("client1", 60000);
            await store.increment("client2", 60000);
            await store.increment("client3", 60000);

            expect(store.size()).toBe(3);
        });
    });

    describe("clear()", () => {
        it("should remove all entries", async () => {
            await store.increment("client1", 60000);
            await store.increment("client2", 60000);
            await store.increment("client3", 60000);

            store.clear();

            expect(store.size()).toBe(0);
        });

        it("should allow new entries after clear", async () => {
            await store.increment("client1", 60000);
            store.clear();

            const info = await store.increment("client1", 60000);
            expect(info.count).toBe(1);
        });
    });
});
