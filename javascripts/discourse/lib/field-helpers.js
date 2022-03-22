function undasherize(string) {
  return string
    .replace('-', ' ')
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

function isDefined(value) {
  return value !== null && value !== undefined;
}

function arrayNotEmpty(array) {
  return array?.length;
}

export { undasherize, isDefined, arrayNotEmpty };
