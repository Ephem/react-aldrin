const UNSAFE_TO_SAFE = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};

export default function serialize(obj, replacer) {
    return JSON.stringify(obj, replacer).replace(
        /[<>\/\u2028\u2029]/g,
        c => UNSAFE_TO_SAFE[c]
    );
}
