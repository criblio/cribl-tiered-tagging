function isDefined(value) {
  return value !== null && value !== undefined;
}

function arrayNotEmpty(array) {
  return array?.length;
}

export { isDefined, arrayNotEmpty };
