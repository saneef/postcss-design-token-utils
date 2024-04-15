import test from "ava";
import cssnano from "cssnano";
import postcss from "postcss";
import plugin from "../index.js";

async function run(tokens, input, options) {
  return postcss([plugin(tokens, options), cssnano]).process(input, {
    from: "test.css",
  });
}

test("Generate utility classes", async (t) => {
  const tokens = { color: { accent: "#ff0", dark: "#111" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    utilityClasses: [{ id: "color", property: "color" }],
  };
  const res = await run(tokens, input, options);
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
  const res = await run(tokens, input, options);
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}.text-dark{color:var(--color-dark)}`,
  );
});

test("Generate viewport variants", async (t) => {
  const tokens = { color: { accent: "#ff0" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    viewports: {
      sm: "320px",
      md: "640px",
    },
    utilityClasses: [
      {
        id: "color",
        prefix: "text",
        property: "color",
        viewportVariants: true,
      },
    ],
  };
  const res = await run(tokens, input, options);
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}@media (min-width:320px){.sm-text-accent{color:var(--color-accent)}}@media (min-width:640px){.md-text-accent{color:var(--color-accent)}}`,
  );
});

test("Generate viewport variants with colon separated classes", async (t) => {
  const tokens = { color: { accent: "#ff0" } };
  const input = `@design-token-utils (utility-classes);`;
  const options = {
    viewports: {
      sm: "320px",
      md: "640px",
    },
    utilityClasses: [
      {
        id: "color",
        prefix: "text",
        property: "color",
        viewportVariants: true,
      },
    ],
    mediaQueryClassSeparator: ":",
  };
  const res = await run(tokens, input, options);
  t.is(
    res.css,
    `.text-accent{color:var(--color-accent)}@media (min-width:320px){.sm:text-accent{color:var(--color-accent)}}@media (min-width:640px){.md:text-accent{color:var(--color-accent)}}`,
  );
});