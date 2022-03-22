import { apiInitializer } from 'discourse/lib/api';

export default apiInitializer('0.11.1', (api) => {
  api.composerBeforeSave(() => {
    let composerPostModel = api.container.lookup('model:composer');
    console.log('This', composerPostModel);
    // const product = this.get('product');
    // const versions = this.get('versions');
    // const tags = this.get('tags');
    // console.log('Before Saving:', product, versions, tags);
  });
});

//TODO: draft does not prefill ?
