import cssnano from "cssnano";
import postcss from "postcss";
import plugin from "../index.js";

export async function run(input, options) {
  return postcss([
    plugin(options),
    cssnano({
      preset: ["lite"],
    }),
  ]).process(input, {
    from: "test.css",
  });
}