import test from "ava";
import cssnano from "cssnano";
import postcss from "postcss";
import plugin from "../index.js";

async function run(tokens, input, options) {
	return postcss([plugin(tokens, options), cssnano]).process(input, {
		from: "test.css",
	});
}

test("Skip custom properties when called outside of a rule", async (t) => {
	const tokens = { color: { accent: "#ff0" } };
	const input = `@process-design-tokens "custom-properties";`;
	const res = await run(tokens, input);
	t.is(res.css, `@process-design-tokens "custom-properties";`);
});

test("Generates custom properties", async (t) => {
	const tokens = { color: { accent: "#ff0", primary: "#0ff" } };
	const input = `:root { @process-design-tokens "custom-properties"; }`;
	const res = await run(tokens, input);
	t.is(res.css, ":root{--color-accent:#ff0;--color-primary:#0ff}");
});

test("Generates with number values", async (t) => {
	const tokens = { leading: { s: 1.1, m: 1.5, lg: 1.7 } };
	const input = `:root { @process-design-tokens "custom-properties"; }`;
	const res = await run(tokens, input);
	t.is(res.css, ":root{--leading-s:1.1;--leading-m:1.5;--leading-lg:1.7}");
});
test("Generates with array values", async (t) => {
	const tokens = {
		fontFamily: [
			"Inter",
			"Segoe UI",
			"Roboto",
			"Helvetica Neue",
			"Arial",
			"sans-serif",
		],
	};
	const input = `:root { @process-design-tokens "custom-properties"; }`;
	const res = await run(tokens, input);
	t.is(
		res.css,
		":root{--font-family:Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}",
	);
});

test("Generates with prefix options", async (t) => {
	const tokens = {
		color: { accent: "#ff0" },
		fontSize: { "step-0": "1rem", "step-1": "2rem" },
	};
	const input = `:root { @process-design-tokens "custom-properties"; }`;
	const res = await run(tokens, input, {
		customProperties: [
			{ id: "color", prefix: "c" },
			{ id: "fontSize", prefix: "" },
		],
	});
	t.is(res.css, ":root{--c-accent:#ff0;--step-0:1rem;--step-1:2rem}");
});
