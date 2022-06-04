import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export function buildDropdown(all, selected) {
  return all
    .filter((value) => selected.includes(value.name))
    .map((value) => value.versions)
    .flat(1);
}

export function updateDependantDropdowns(context, buffered, all, action) {
  if (!buffered) {
    return;
  }

  const updated = all
    .filter((v) => buffered.includes(v.name))
    .map((v) => v.name);

  return context.send(action, updated);
}

export function resetProperties(model, component) {
  model.setProperties({
    product: null,
    version: null,
  });

  return component.set("showVersions", false);
}

export function setProductProps(context, all, selected) {
  const versions = buildDropdown(all, selected);

  return context.setProperties({
    showVersions: true,
    versions,
  });
}

// ? TODO REMOVE ?
// export function setVersionProps(context, all, selected) {
//   return context.setProperties({
//     showVersions: true,
//   })
// }

export function handlePrefillData(allData, context) {
  // Prefill Data when opening a draft/editing a topic
  const model = context.model;

  if (model.product) {
    context.set("product", model.product);
    setProductProps(context, allData, model.product);
  }

  if (model.versions) {
    const allVersions = buildDropdown(allData, model.product);
    context.set("versions", allVersions);
  }

  // Prefill otherTags input when editing old topics that don't only have regular tags
  if (model.product === null && model.versions === null && model.tags) {
    model.set("plainTags", model.tags);
  }
}

export function prepareData(context) {
  return ajax(`/products.json`)
    .then((result) => {
      const allData = result.products;
      context.set("products", allData);
      handlePrefillData(allData, context);
    })
    .catch(popupAjaxError);
}
