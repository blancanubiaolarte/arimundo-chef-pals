import { expect, test } from "bun:test";
import { limitFor, usageLabel } from "@/lib/usage-limits";
test("limits", () => {
  expect(limitFor("trial").perCycle).toBe(5);
  expect(limitFor("basico").perCycle).toBe(30);
  expect(limitFor("familiar").perCycle).toBe(60);
  expect(limitFor("pro").perCycle).toBe(60);
  expect(limitFor("premium").perCycle).toBe(100);
  expect(limitFor("gratis").perCycle).toBe(0);
});
test("label", () => {
  expect(usageLabel({plan:"trial",planName:"x",used:2,limit:5,remaining:3,period:"prueba",renewsAt:"",lastRecipeAt:null,isTrial:true})).toContain("3 de 5");
});
