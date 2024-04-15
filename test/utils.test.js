import test from "ava";
import { parseAtRuleParams } from "../lib/utils.js";

test("parseAtRuleParams: parses with no arguments", async (t) => {
	const res = parseAtRuleParams("(custom-properties)");
	t.is(res, undefined);
});

test("parseAtRuleParams: parses with one argument", async (t) => {
	const res = parseAtRuleParams("(custom-properties: colors)");
	t.deepEqual(res, ["colors"]);
});

test("parseAtRuleParams: parses with more than one arguments", async (t) => {
	const res = parseAtRuleParams("(custom-properties: space,font-size)");
	t.deepEqual(res, ["space", "font-size"]);
});
