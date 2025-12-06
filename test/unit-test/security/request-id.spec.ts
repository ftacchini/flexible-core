import "jasmine";
import { RequestId, SecurityError, SecurityErrorCodes } from "../../../src";

describe("RequestId", () => {
    describe("from()", () => {
        it("should create RequestId from valid string", () => {
            const id = RequestId.from("abc-123_xyz");
            expect(id.value).toBe("abc-123_xyz");
        });

        it("should accept alphanumeric characters", () => {
            const id = RequestId.from("abcABC123");
            expect(id.value).toBe("abcABC123");
        });

        it("should accept hyphens and underscores", () => {
            const id = RequestId.from("abc-123_xyz-456");
            expect(id.value).toBe("abc-123_xyz-456");
        });

        it("should throw error for empty string", () => {
            expect(() => RequestId.from("")).toThrowError(SecurityError);
        });

        it("should throw error for string exceeding max length", () => {
            const longString = "a".repeat(257);
            expect(() => RequestId.from(longString)).toThrowError(SecurityError);
        });

        it("should throw error for invalid characters", () => {
            expect(() => RequestId.from("abc@123")).toThrowError(SecurityError);
            expect(() => RequestId.from("abc 123")).toThrowError(SecurityError);
            expect(() => RequestId.from("abc\n123")).toThrowError(SecurityError);
        });

        it("should throw SecurityError with correct code", () => {
            try {
                RequestId.from("invalid@id");
                fail("Should have thrown error");
            } catch (error) {
                expect(error).toBeInstanceOf(SecurityError);
                expect((error as SecurityError).code).toBe(SecurityErrorCodes.INVALID_REQUEST_ID);
            }
        });

        it("should accept custom max length", () => {
            const id = RequestId.from("abc", { maxLength: 10 });
            expect(id.value).toBe("abc");

            expect(() => RequestId.from("abcdefghijk", { maxLength: 10 }))
                .toThrowError(SecurityError);
        });

        it("should accept custom pattern", () => {
            const id = RequestId.from("123", { pattern: /^\d+$/ });
            expect(id.value).toBe("123");

            expect(() => RequestId.from("abc", { pattern: /^\d+$/ }))
                .toThrowError(SecurityError);
        });
    });

    describe("tryFrom()", () => {
        it("should return RequestId for valid string", () => {
            const id = RequestId.tryFrom("abc-123");
            expect(id).not.toBeNull();
            expect(id!.value).toBe("abc-123");
        });

        it("should return null for invalid string", () => {
            const id = RequestId.tryFrom("invalid@id");
            expect(id).toBeNull();
        });

        it("should return null for empty string", () => {
            const id = RequestId.tryFrom("");
            expect(id).toBeNull();
        });

        it("should return null for string exceeding max length", () => {
            const longString = "a".repeat(257);
            const id = RequestId.tryFrom(longString);
            expect(id).toBeNull();
        });
    });

    describe("fromOrGenerate()", () => {
        it("should return RequestId for valid string", () => {
            const id = RequestId.fromOrGenerate("abc-123");
            expect(id.value).toBe("abc-123");
        });

        it("should generate new ID for invalid string", () => {
            const id = RequestId.fromOrGenerate("invalid@id");
            expect(id).not.toBeNull();
            expect(id.value).not.toBe("invalid@id");
            expect(id.value.length).toBeGreaterThan(0);
        });

        it("should generate new ID for empty string", () => {
            const id = RequestId.fromOrGenerate("");
            expect(id).not.toBeNull();
            expect(id.value.length).toBeGreaterThan(0);
        });

        it("should generate new ID when no value provided", () => {
            const id = RequestId.fromOrGenerate();
            expect(id).not.toBeNull();
            expect(id.value.length).toBeGreaterThan(0);
        });
    });

    describe("generate()", () => {
        it("should generate valid RequestId", () => {
            const id = RequestId.generate();
            expect(id).not.toBeNull();
            expect(id.value.length).toBeGreaterThan(0);
        });

        it("should generate different IDs", () => {
            const id1 = RequestId.generate();
            const id2 = RequestId.generate();
            expect(id1.value).not.toBe(id2.value);
        });

        it("should generate IDs that pass validation", () => {
            const id = RequestId.generate();
            // Should not throw
            const validated = RequestId.from(id.value);
            expect(validated.value).toBe(id.value);
        });

        it("should generate URL-safe IDs", () => {
            const id = RequestId.generate();
            // Should not contain +, /, or =
            expect(id.value).not.toContain("+");
            expect(id.value).not.toContain("/");
            expect(id.value).not.toContain("=");
        });
    });

    describe("toString()", () => {
        it("should return the value", () => {
            const id = RequestId.from("abc-123");
            expect(id.toString()).toBe("abc-123");
        });
    });

    describe("equals()", () => {
        it("should return true for equal IDs", () => {
            const id1 = RequestId.from("abc-123");
            const id2 = RequestId.from("abc-123");
            expect(id1.equals(id2)).toBe(true);
        });

        it("should return false for different IDs", () => {
            const id1 = RequestId.from("abc-123");
            const id2 = RequestId.from("xyz-789");
            expect(id1.equals(id2)).toBe(false);
        });
    });

    describe("toJSON()", () => {
        it("should return the value", () => {
            const id = RequestId.from("abc-123");
            expect(id.toJSON()).toBe("abc-123");
        });

        it("should work with JSON.stringify", () => {
            const id = RequestId.from("abc-123");
            const json = JSON.stringify({ requestId: id });
            expect(json).toBe('{"requestId":"abc-123"}');
        });
    });

    describe("immutability", () => {
        it("should provide value through getter", () => {
            const id = RequestId.from("abc-123");
            expect(id.value).toBe("abc-123");
            // TypeScript prevents direct modification of _value
            // The value object pattern ensures immutability at the API level
        });
    });
});
