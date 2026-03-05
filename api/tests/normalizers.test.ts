import { describe, expect, it } from "vitest";
import { normalizePrice, normalizeUnit } from "../../shared/src/normalizers";

describe("normalizers", () => {
  it("normalizes euro price", () => {
    expect(normalizePrice("€ 2,49")).toBe(2.49);
  });

  it("normalizes unit", () => {
    expect(normalizeUnit("offerta € / kg")).toBe("€/kg");
  });
});
