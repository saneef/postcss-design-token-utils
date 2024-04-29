import test from "ava";

import { run } from "./runner.mjs";

test("Generate utility classes", async (t) => {
  const tokens = { color: { accent: "#ff0", dark: "#111" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    utilityClasses: [{ id: "color", property: "color" }],
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.color-accent{color:var(--color-accent)}.color-dark{color:var(--color-dark)}`,
  );
});

test("Generate with prefix", async (t) => {
  const tokens = {
    color: { accent: "#ff0", dark: "#111" },
    textSize: {
      "step-0": "1rem",
      "step-1": "1.333rem",
      "step-2": "1.776rem",
    },
  };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    utilityClasses: [
      { id: "color", property: "color", prefix: "text" },
      { id: "textSize", property: "font-size", prefix: "" },
    ],
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}.text-dark{color:var(--color-dark)}.step-0{font-size:var(--text-size-step-0)}.step-1{font-size:var(--text-size-step-1)}.step-2{font-size:var(--text-size-step-2)}`,
  );
});

test("Generate with multiple properties", async (t) => {
  const tokens = { space: { m: "1rem", l: "2rem" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    utilityClasses: [
      {
        id: "space",
        prefix: "margin-y",
        property: ["margin-top", "margin-bottom"],
      },
    ],
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.margin-y-m{margin-top:var(--space-m);margin-bottom:var(--space-m)}.margin-y-l{margin-top:var(--space-l);margin-bottom:var(--space-l)}`,
  );
});

test("Generate with responsive variants", async (t) => {
  const tokens = { color: { accent: "#ff0" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    breakpoints: {
      sm: "320px",
      md: "640px",
    },
    utilityClasses: [
      {
        id: "color",
        prefix: "text",
        property: "color",
        responsiveVariants: true,
      },
    ],
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}@media (min-width: 320px){.sm-text-accent{color:var(--color-accent)}}@media (min-width: 640px){.md-text-accent{color:var(--color-accent)}}`,
  );
});

test("Generate viewport variants with colon separated classes", async (t) => {
  const tokens = { color: { accent: "#ff0" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    breakpoints: {
      sm: "320px",
      md: "640px",
    },
    utilityClasses: [
      {
        id: "color",
        prefix: "text",
        property: "color",
        responsiveVariants: true,
      },
    ],
    responsivePrefixClassSeparator: "\\:",
  };
  const res = await run(input, { tokens, ...options });

  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}@media (min-width: 320px){.sm\\:text-accent{color:var(--color-accent)}}@media (min-width: 640px){.md\\:text-accent{color:var(--color-accent)}}`,
  );
});