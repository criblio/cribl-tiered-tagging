function undasherize(string) {
  return string
    .replace('-', ' ')
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

export { undasherize };
