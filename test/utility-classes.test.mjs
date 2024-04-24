import test from "ava";
import cssnano from "cssnano";
import postcss from "postcss";
import plugin from "../index.js";

async function run(input, options) {
  return postcss([plugin(options), cssnano]).process(input, {
    from: "test.css",
  });
}

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
  const tokens = { color: { accent: "#ff0", dark: "#111" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    utilityClasses: [{ id: "color", prefix: "text", property: "color" }],
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}.text-dark{color:var(--color-dark)}`,
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
    `.margin-y-m{margin-bottom:var(--space-m);margin-top:var(--space-m)}.margin-y-l{margin-bottom:var(--space-l);margin-top:var(--space-l)}`,
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
    `.text-accent{color:var(--color-accent)}@media (min-width:320px){.sm-text-accent{color:var(--color-accent)}}@media (min-width:640px){.md-text-accent{color:var(--color-accent)}}`,
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
    classResponsivePrefixSeparator: ":",
  };
  const res = await run(input, { tokens, ...options });
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}@media (min-width:320px){.sm:text-accent{color:var(--color-accent)}}@media (min-width:640px){.md:text-accent{color:var(--color-accent)}}`,
  );
});