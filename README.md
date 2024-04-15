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

You can pair this plugin with [purgecss](https://purgecss.com) to remove unused CSS class rules.

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

### Utility classes

> [!IMPORTANT]
> The utility classes are based on CSS custom properties from design tokens.
> Make sure custom properties are included.

The generation of **utility classes is opt-in** based on token `id`.
Using the `utilityClasses` option, we need to provide an array of object with `id`, `property`, and optionally `prefix` for class generation.
Then, we can use at-rule `@design-token-utils (utility-classes);` to insert in the stylesheet.

```js
// postcss.config.js

const tokens = {
  color: {
    accent: "#16a34a",
    dark: "#111827",
    light: "#f3f4f6",
  },
};

const config = {
  plugins: [
    postcssDesignTokenUtils(tokens, {
      utilityClasses: [
        {
          id: "color",
          property: "background-color",
          prefix: "bg",
        },
      ],
    }),
  ],
};
```

Using the `utilityClasses` option, we pick one set of token using `id: "color"`.
The CSS `property` is set to `background-color` and the class name `prefix` to `bg`.
If we don't set `prefix` is not set, the `id` will be used as a prefix, which may be useless for most of the cases.

Then, we can use at-rule `@design-token-utils (utility-classes);` to insert the classes in the stylesheet.

```css
/* source.css */
:root {
  @design-token-utils (custom-properties);
}

@design-token-utils (utility-classes);
```

Once built, this is the output CSS file.

```css
/* output.css */
:root {
  --color-accent: #16a34a;
  --color-dark: #111827;
  --color-light: #f3f4f6;
}
.bg-accent {
  background-color: var(--color-accent);
}
.bg-dark {
  background-color: var(--color-dark);
}
.bg-light {
  background-color: var(--color-light);
}
```

#### Responsive class variants

It is possible to generate responsive modifier class names.
We need to provide breakpoints and specify which classes need responsive variants.

```js
// postcss.config.js

// tokens object from previous example

const config = {
  plugins: [
    postcssDesignTokenUtils(tokens, {
      breakpoints: {
        sm: "320px", // 👈 Added break points
        md: "640px",
      },
      utilityClasses: [
        {
          id: "color",
          property: "background-color",
          prefix: "bg",
          responsiveVariants: true, // 👈 Sets `responsiveVariants` to `true`
        },
      ],
    }),
  ],
};
```

In the previous example, if we provide breakpoints and set `responsiveVariants: true` for token ID, we get below output.

```css
/* output.css */
:root {
  --color-accent: #16a34a;
  --color-dark: #111827;
  --color-light: #f3f4f6;
}

.bg-accent {
  background-color: var(--color-accent);
}
.bg-dark {
  background-color: var(--color-dark);
}
.bg-light {
  background-color: var(--color-light);
}
@media (min-width: 320px) {
  .sm-bg-accent {
    background-color: var(--color-accent);
  }
  .sm-bg-dark {
    background-color: var(--color-dark);
  }
  .sm-bg-light {
    background-color: var(--color-light);
  }
}
@media (min-width: 640px) {
  .md-bg-accent {
    background-color: var(--color-accent);
  }
  .md-bg-dark {
    background-color: var(--color-dark);
  }
  .md-bg-light {
    background-color: var(--color-light);
  }
}
```

You can use `classResponsivePrefixSeparator` property (default: `-`) in `options` to change the separator between responsive prefix and class name.
To generate Tailwind style responsive modifiers, set `mediaQueryClassSeparator: ":"`.
_Beware if you are using purgecss.
Class names with some special character are not considered._
[See note](https://purgecss.com/extractors.html#default-extractor).

## Nested tokens

Even if your token object is nested, this plugin can generate CSS custom properties and class names.
The ID will be generated by merging the IDs of parents and children (recursively), separated by a period.
Example: The tokens within `gray` can be targeted using `color.gray`.

```js
// postcss.config.css
const token = {
  color: {
    gray: { 100: "#f1f5f9", 800: "#1e293b" },
    primary: { 100: "#dcfce7", 800: "#166534" },
  },
};

const config = {
  plugins: [
    postcssDesignTokenUtils(tokens, {
      utilityClasses: [
        {
          id: "color.gray",
          property: "background-color",
          prefix: "bg-shade",
        },
      ],
    }),
  ],
};
```