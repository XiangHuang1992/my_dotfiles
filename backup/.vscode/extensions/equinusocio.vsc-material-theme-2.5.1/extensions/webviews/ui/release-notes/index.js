"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getReleaseNotes = () => {
    const uri = 'https://raw.githubusercontent.com/equinusocio/vsc-material-theme-releases/master/releases/index.json';
    return fetch(uri).then(res => res.json());
};
const renderTemplate = (posts) => {
    return `${posts.reduce((acc, { version, title, fixed, new: newItems, breaking }) => acc.concat(`<section class="Release">
    <header class="Release__Header">
      <span class="Release__Number">${version}</span>
      <h2 class="Release__Title">${title}</h2>
    </header>
    <ul class="Release-List">
      ${fixed.reduce((accc, src) => accc.concat(`<li data-type="fixed">${src}</li>`), '')}
      ${newItems.reduce((accc, src) => accc.concat(`<li data-type="new">${src}</li>`), '')}
      ${breaking.reduce((accc, src) => accc.concat(`<li data-type="breaking">${src}</li>`), '')}
    </ul>
  </section>`), '')}`;
};
getReleaseNotes().then((res) => {
    document.querySelector('.Container').innerHTML = renderTemplate(res);
});
//# sourceMappingURL=index.js.map