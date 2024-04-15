# postcss-design-token-utils

PostCSS plugin to convert design tokens to CSS custom properties and utility classes.

This plugin is inspired by Andy Bell's [Gorko](https://github.com/Andy-set-studio/gorko), and his latest [utility class generation project](https://github.com/Set-Creative-Studio/cube-boilerplate/) using Tailwind.
The method of using Tailwind comes with fancy features like just-in-time class generation.
But, I would rather not depend on Tailwind for one feature of generating classes and utility class.
Not only that, I find the Tailwind configuration (like Andy did) quite scary.
Who knows if the same configuration works in the next version?
So, I'm going with slightly low-tech here.

My motivation is to create a plugin that does one job (actually two) of generating CSS custom properties from design tokens.
You can maintain the tokens in which ever formats – JSON, or YAML – you prefer.
Do turn into an object, before passing the tokens to this plugin.

You can pair this plugin with [purgecss](https://purgecss.com) to remove used CSS class rules.

See [my example project](https://github.com/saneef/postcss-design-token-utils-sample-project) to see how I convert JSON files to JS Object and use purgecss.

## Usage

### Installation

```sh
npm install --save-dev postcss-design-token-utils
```

### Configuration

```js
// postcss.config.js
const postcssDesignTokenUtils = require("postcss-design-token-utils");

const tokens = {
  color: {
    accent: "#16a34a",
    dark: "#111827",
    light: "#f3f4f6",
  },
  space: {
    xs: "0.25rem",
    s: "0.5rem",
    m: "1rem",
    l: "2rem",
  },
};

const config = {
  plugins: [
    /* ...other plugins... */
    postcssDesignTokenUtils(
      tokens, // Tokens
      {
        /* pluginOptions */
      },
    ),
  ],
};
```

This plug exposes `@design-token-utils` at-rule.
Using the at-rule with suitable params you can generate CSS custom properties and utility classes.

### CSS properties from design tokens

At-rule, `@design-token-utils (custom-properties);` is used to generated CSS custom properties.
The at-rule should be used within a rule (selector), else the properties won't be generated.

```css
/* source.css */
:root {
  @design-token-utils (custom-properties);
}
```

For the `token` passed in the example config, these custom properties will be populated.

```css
/* output.css */
:root {
  --color-accent: #16a34a;
  --color-dark: #111827;
  --color-light: #f3f4f6;
  --space-xs: 0.25rem;
  --space-s: 0.5rem;
  --space-m: 1rem;
  --space-l: 2rem;
}
```

#### Grouping tokens

Using options, `customProperties`, the behaviour of custom property generation can be altered.

In the below example, we have two sets of tokens, `color` and `darkThemeColor` (these are `id`s).

Using the options, the `darkThemeColor` is marked with the group name `dark`.
You can also see that the `prefix` is set to `color`, which will change the prefix of the generated properties.
By default, `id` is used as prefix.

```js
// postcss.config.js
const tokens = {
  color: {
    accent: "#16a34a",
    dark: "#111827",
    light: "#f3f4f6",
  },
  darkThemeColor: {
    accent: "#16a34a",
    // The `light` and `dark` values are interchanged
    light: "#111827",
    dark: "#f3f4f6",
  },
};

const config = {
  plugins: [
    postcssDesignTokenUtils(tokens, {
      customProperties: [
        { id: "darkThemeColor", prefix: "color", group: "dark" },
      ],
    }),
  ],
};
```

The call `@design-token-utils (custom-properties);` only generates tokens without any groups. We pass the group names (comma-separated) with the at-rule call. Example: `@design-token-utils (custom-properties: dark);`

In cases where you need to generate all the custom properties, grouped and ungrouped, you can pass `all` as an argument, like `@design-token-utils (custom-properties: all);`

Inside the `(prefers-color-scheme: dark)` media query, we can call ` @design-token-utils (custom-properties: dark);` to generate `dark` group properties.

```css
/* source.css */
:root {
  @design-token-utils (custom-properties);
}

@media (prefers-color-scheme: dark) {
  :root {
    @design-token-utils (custom-properties: dark);
  }
}
```

With the above code, we have reassigned the properties from `:root` with a new set of values within `(prefers-color-scheme: dark)` media query.

```css
/* output.css */
:root {
  --color-accent: #16a34a;
  --color-dark: #111827;
  --color-light: #f3f4f6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-accent: #16a34a;
    --color-light: #111827;
    --color-dark: #f3f4f6;
  }
}
```

Similarly, you can invoke at-rule within a class selector (`.dark {}`) or a data attribute (`[data-theme="dark"] {}`).
This is handy for generating scheme or theme base properties.

