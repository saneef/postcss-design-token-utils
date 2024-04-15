/**
 * Parse @rule params
 *
 * @example
 * // returns undefined
 * parseAtRuleParams("(custom-properties)")
 * @example
 * // returns ["one","two"]
 * parseAtRuleParams("(custom-properties: one, two)")
 *
 * @param {string}  paramString  The parameter string
 * @param {string}  [argName="custom-properties"]  The argument name
 * @return {Array<string>|undefined}
 */
function parseAtRuleParams(paramString, argName = "custom-properties") {
  // Removes any spaces
  const str = paramString.replace(/\s/g, "");

  const start = `(${argName}:`;
  const end = ")";
  if (str.startsWith(start) && str.endsWith(end)) {
    const args = str.replace(start, "").replace(end, "");
    if (args.length) return args.split(",");
  }
}

module.exports = {
  parseAtRuleParams,
};
