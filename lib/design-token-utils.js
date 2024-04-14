// @ts-check
import kebabCase from "just-kebab-case";

const atRuleString = "design-token-utils";

/** @type {import('postcss').PluginCreator} PluginCreator */
const plugin = (
	tokens = {},
	{
		customProperties = [],
		viewports = [],
		utilityClasses = [],
		mediaQueryClassSeparator = "-",
	} = {},
) => {
	const customPropPrefixMap = new Map(
		customProperties
			.filter(({ id, prefix }) => id !== undefined && prefix !== undefined)
			.map(({ id, prefix }) => [id, prefix]),
	);
	const T = createCustomProperties(tokens, { prefixMap: customPropPrefixMap });
	const C = createUtilityClasses(T, utilityClasses);
	const V = Object.entries(viewports);

	return {
		postcssPlugin: "postcss-process-tokens",
		AtRule(atRule, { Declaration, Rule, AtRule }) {
			// Insert custom properties
			if (
				atRule.name == atRuleString &&
				atRule.params?.includes("(custom-properties") &&
				atRule.parent?.type !== "root"
			) {
				const csscustomProperties = T.map(
					({ prop, value }) =>
						new Declaration({ prop, value: /** @type {string} */ (value) }),
				);
				atRule.replaceWith(csscustomProperties);
			}

			// Insert utility classes
			if (
				atRule.name == atRuleString &&
				atRule.params?.includes('"utility-classes"') &&
				atRule.parent?.type === "root"
			) {
				const rules = C.map(({ selectorBase, prop, value }) => {
					const rule = new Rule({ selector: `.${selectorBase}` });
					rule.append(
						new Declaration({ prop, value: /** @type {string} */ (value) }),
					);
					return rule;
				});

				const mediaAtRules = V.map(([mqPrefix, mqParams]) => {
					const mq = new AtRule({
						name: "media",
						params: `(min-width: ${mqParams})`,
					});
					const rules = C.map(
						({ selectorBase, prop, value, skipScreenVariant }) => {
							if (skipScreenVariant) {
								return;
							}

							const rule = new Rule({
								selector: `.${mqPrefix}${mediaQueryClassSeparator}${selectorBase}`,
							});
							rule.append(
								new Declaration({ prop, value: /** @type {string} */ (value) }),
							);
							return rule;
						},
					).filter((r) => r !== undefined);

					// @ts-ignore
					mq.append(rules);

					return mq;
				});

				// atRule.replaceWith(mediaAtRules);

				atRule.replaceWith([...rules, ...mediaAtRules]);
			}
		},
	};
};
plugin.postcss = true;

/**
 * @param      {object|string|string[]}  v
 * @return     {string|number|null}
 */
function processValue(v) {
	if (Array.isArray(v)) {
		return v.join(", ");
	}
	if (["string", "number"].includes(typeof v)) {
		return v;
	}
	return null;
}

/**
 * @typedef {object} TokenObject
 * @property {string} prop
 * @property {string} name
 * @property {string|number} value
 * @property {string=} id
 */

function createCustomProperties(
	tokens,
	{ prefixMap = new Map(), separator = "-" } = {},
) {
	/**
	 * @param      {object}  object  The object
	 * @param      {string=}  parentId  The prefix
	 * @return     {Array<TokenObject>}
	 */
	function createTokenObject(object, parentId) {
		return Object.keys(object).reduce(
			/** @param {Array<TokenObject>} acc */
			(acc, k) => {
				const prefix =
					parentId === undefined
						? undefined
						: prefixMap.get(parentId) !== undefined
							? prefixMap.get(parentId)
							: parentId;

				const prop = prefix === undefined ? k : `${prefix}.${k}`;

				const value = processValue(object[k]);

				if (value) {
					return [
						...acc,
						{
							...(parentId !== undefined ? { group: parentId } : {}),
							name: k,
							prop,
							value,
						},
					];
				}
				return [...acc, ...createTokenObject(object[k], prop)];
			},
			[],
		);
	}

	return createTokenObject(tokens).map((d) => {
		const propBaseName = kebabCase(d.prop);
		const className = propBaseName;
		return {
			...d,
			prop: `--${propBaseName}`,
		};
	});
}

/**
 * @typedef {object} ClassObject
 * @property {string} selectorBase
 * @property {string} prop
 * @property {string|number} value
 * @property {boolean} skipScreenVariant
 */

/**
 * Creates utility classes.
 *
 * @param  {Array<object>}  tokenObjects
 * @param  {object}  options
 * @return {Array<ClassObject>}
 */
function createUtilityClasses(tokenObjects, options) {
	return options.flatMap(({ id, property, prefix, screenVariants = false }) => {
		return tokenObjects
			.filter((t) => t.group === id)
			.map(({ prop, value, name }) => {
				const selectorPrefix = prefix ?? kebabCase(id);
				return {
					selectorBase: `${selectorPrefix}-${name}`,
					prop: property,
					value: `var(${prop})`,
					skipScreenVariant: !screenVariants,
				};
			});
	});
}

export default plugin;
