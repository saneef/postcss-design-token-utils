import test from "ava";

import { run } from "./runner.mjs";

test("Skips when applied outside of a rule", async (t) => {
  const tokens = { color: { accent: "#ff0" } };
  const input = `@design-token-utils (custom-properties);`;
  const res = await run(input, { tokens });
  t.is(res.css, `@design-token-utils (custom-properties);`);
});

test("Generates custom properties", async (t) => {
  const tokens = { color: { accent: "#ff0", primary: "#0ff" } };
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, { tokens });
  t.is(res.css, ":root{--color-accent:#ff0;--color-primary:#0ff}");
});

test("Generates with number values", async (t) => {
  const tokens = { leading: { s: 1.1, m: 1.5, lg: 1.7 } };
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, { tokens });
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
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, { tokens });
  t.is(
    res.css,
    ":root{--font-family:Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}",
  );
});

test("Generates with prefix properties", async (t) => {
  const tokens = {
    color: { accent: "#ff0" },
    fontSize: { "step-0": "1rem", "step-1": "2rem" },
  };
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, {
    tokens,
    customProperties: [
      { id: "color", prefix: "c" },
      { id: "fontSize", prefix: "" },
    ],
  });
  t.is(res.css, ":root{--c-accent:#ff0;--step-0:1rem;--step-1:2rem}");
});

test("Generates ungrouped properties when no groups specified", async (t) => {
  const tokens = {
    color: { accent: "#ff0" },
    fontFamily: { base: "sans-serif", mono: "monospace" },
  };
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, {
    tokens,
    customProperties: [{ id: "fontFamily", group: "font" }],
  });
  t.is(res.css, ":root{--color-accent:#ff0}");
});

test("Generates all groups", async (t) => {
  const tokens = {
    color: { accent: "#ff0" },
    fontFamily: { base: "sans-serif", mono: "monospace" },
  };
  const input = `:root { @design-token-utils (custom-properties: all); }`;
  const res = await run(input, {
    tokens,
    customProperties: [{ id: "color" }, { id: "fontFamily", group: "font" }],
  });
  t.is(
    res.css,
    ":root{--color-accent:#ff0;--font-family-base:sans-serif;--font-family-mono:monospace}",
  );
});

test("Generates properties from a group", async (t) => {
  const tokens = {
    color: { accent: "#ff0" },
    fontFamily: { base: "sans-serif", mono: "monospace" },
  };
  const input = `:root { @design-token-utils (custom-properties: font); }`;
  const res = await run(input, {
    tokens,
    customProperties: [{ id: "color" }, { id: "fontFamily", group: "font" }],
  });
  t.is(
    res.css,
    ":root{--font-family-base:sans-serif;--font-family-mono:monospace}",
  );
});

test("Generates custom properties from nested tokens", async (t) => {
  const tokens = {
    color: {
      gray: { 100: "#f1f5f9", 800: "#1e293b" },
    },
  };
  const input = `:root { @design-token-utils (custom-properties); }`;
  const res = await run(input, {
    tokens,
    customProperties: [{ id: "color.gray", prefix: "shade" }],
  });
  t.is(res.css, ":root{--shade-100:#f1f5f9;--shade-800:#1e293b}");
});

test("Generates custom properties by group from nested tokens", async (t) => {
  const tokens = {
    neutral: {
      white: "white",
      gray: { 100: "#f1f5f9", 800: "#1e293b" },
    },
  };
  const input = `:root { @design-token-utils (custom-properties: neutrals); }`;
  const res = await run(input, {
    tokens,
    customProperties: [{ id: "neutral", group: "neutrals" }],
  });
  t.is(
    res.css,
    ":root{--neutral-white:white;--neutral-gray-100:#f1f5f9;--neutral-gray-800:#1e293b}",
  );
});

test("Generates prefixed custom properties by group from nested tokens", async (t) => {
  const tokens = {
    neutral: {
      white: "white",
      gray: { 100: "#f1f5f9", 800: "#1e293b" },
    },
  };
  const input = `:root { @design-token-utils (custom-properties: neutrals); }`;
  const res = await run(input, {
    tokens,
    customProperties: [
      { id: "neutral", prefix: "color-neutral", group: "neutrals" },
    ],
  });
  t.is(
    res.css,
    ":root{--color-neutral-white:white;--color-neutral-gray-100:#f1f5f9;--color-neutral-gray-800:#1e293b}",
  );
});