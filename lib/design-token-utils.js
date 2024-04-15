// @ts-check
import kebabCase from "just-kebab-case";
import { Declaration, Rule } from "postcss";
import { parseAtRuleParams } from "./utils.js";

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
	const prefixMap = new Map(
		customProperties
			.filter(({ id, prefix }) => id !== undefined && prefix !== undefined)
			.map(({ id, prefix }) => [id, prefix]),
	);
	const groupMap = new Map(
		customProperties
			.filter(({ id, group }) => id !== undefined && group !== undefined)
			.map(({ id, group }) => [id, group]),
	);
	const T = createCustomProperties(tokens, { prefixMap, groupMap });
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
				const groups = parseAtRuleParams(atRule.params);

				const FT =
					groups === undefined // When group is not specified only list ungrouped ones
						? T.filter((t) => t.group === undefined)
						: groups.includes("all") // List all when 'all' is mentioned
							? T
							: T.filter((t) => t.group !== undefined)
									// @ts-ignore
									.filter((t) => groups.includes(t.group));

				const csscustomProperties = FT.map(
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
				if (!C.length) {
					console.warn(
						"No utility classes generated. Looks like `utilityClasses` option is missing or invalid.",
					);
				}

				const rules = C.map((c) =>
					generateUtilityClassRule(c, {
						selector: ({ selectorBase }) => `.${selectorBase}`,
					}),
				);

				const mediaAtRules = V.map(([mqPrefix, mqParams]) => {
					const mq = new AtRule({
						name: "media",
						params: `(min-width: ${mqParams})`,
					});
					const rules = C.map((c) => {
						if (c.skipViewportVariant) {
							return;
						}

						const rule = generateUtilityClassRule(c, {
							selector: ({ selectorBase }) =>
								`.${mqPrefix}${mediaQueryClassSeparator}${selectorBase}`,
						});

						return rule;
					}).filter((r) => r !== undefined);

					// @ts-ignore
					mq.append(rules);

					return mq;
				});

				atRule.replaceWith([...rules, ...mediaAtRules]);
			}
		},
	};
};
plugin.postcss = true;

/**
 * Generates PostCSS Rule
 * @param  {ClassObject}    classObject  Class object
 * @param  {Object} obj
 * @param  {Function}  [obj.selector=({selectorBase})=>`.${selectorBase}`]  Function to generate class name. Class object will given as argument
 * @return  {Rule}
 */
function generateUtilityClassRule(
	classObject,
	{ selector = ({ selectorBase }) => `.${selectorBase}` },
) {
	const { selectorBase, prop, value } = classObject;
	const rule = new Rule({ selector: selector(classObject) });
	rule.append(new Declaration({ prop, value: /** @type {string} */ (value) }));
	return rule;
}

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
 * @property {string=} group
 */

function createCustomProperties(
	tokens,
	{ prefixMap = new Map(), groupMap = new Map(), separator = "-" } = {},
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
				const group = groupMap.get(parentId);

				if (value) {
					return [
						...acc,
						{
							name: k,
							prop,
							value,
							parentId,
							group,
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
 * @property {boolean} skipViewportVariant
 */

/**
 * Creates utility classes.
 *
 * @param  {Array<object>}  tokenObjects
 * @param  {object}  options
 * @return {Array<ClassObject>}
 */
function createUtilityClasses(tokenObjects, options) {
	return options.flatMap(
		({ id, property, prefix, viewportVariants = false }) => {
			return tokenObjects
				.filter((t) => t.parentId === id)
				.map(({ prop, value, name }) => {
					const selectorPrefix = prefix ?? kebabCase(id);
					return {
						selectorBase: `${selectorPrefix}-${name}`,
						prop: property,
						value: `var(${prop})`,
						skipViewportVariant: !viewportVariants,
					};
				});
		},
	);
}

export default plugin;
