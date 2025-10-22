(function () {
  var DEFAULT_CONFIG = {
    branch: 'main',
    text: '📝 在 GitHub 上编辑本页',
    pattern: '{repo}/blob/{branch}/{path}',
    repo: ''
  };

  function normalizeRepo(repo) {
    if (!repo) {
      return '';
    }

    var cleaned = repo.trim();

    if (cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    if (cleaned.startsWith('github.com/')) {
      cleaned = cleaned.slice('github.com/'.length);
    }

    return 'https://github.com/' + cleaned.replace(/^\/+/, '');
  }

  function inferRepoFromLocation() {
    var host = (window.location && window.location.hostname) || '';

    if (host.endsWith('github.io')) {
      var owner = host.slice(0, host.length - '.github.io'.length);
      if (!owner) {
        return '';
      }

      var segments = (window.location.pathname || '')
        .split('/')
        .filter(Boolean);

      if (!segments.length) {
        return '';
      }

      return normalizeRepo(owner + '/' + segments[0]);
    }

    return '';
  }

  function resolveRepo(config) {
    if (config.repo) {
      return normalizeRepo(config.repo);
    }

    if (window.$docsify && window.$docsify.repo) {
      var repoFromDocsify = normalizeRepo(window.$docsify.repo);
      if (repoFromDocsify) {
        return repoFromDocsify;
      }
    }

    return inferRepoFromLocation();
  }

  function buildEditUrl(config, filePath) {
    var repo = resolveRepo(config);

    if (!repo) {
      return '';
    }

    if (window.$docsify) {
      var currentRepo = window.$docsify.repo;
      if (
        !currentRepo ||
        (typeof currentRepo === 'string' && !currentRepo.trim())
      ) {
        window.$docsify.repo = repo;
      }
    }

    var branch = config.branch || DEFAULT_CONFIG.branch;
    var pattern = config.pattern || DEFAULT_CONFIG.pattern;
    var path = filePath || 'README.md';

    return pattern
      .replace('{repo}', repo)
      .replace('{branch}', branch)
      .replace('{path}', path);
  }

  function pluginFactory(hook, vm) {
    hook.afterEach(function (html, next) {
      var config = window.$docsify && window.$docsify.editLink;
      config = Object.assign({}, DEFAULT_CONFIG, config || {});

      var filePath = vm.route.file || 'README.md';
      var editUrl = buildEditUrl(config, filePath);

      if (!editUrl) {
        next(html);
        return;
      }

      var label = config.text || DEFAULT_CONFIG.text;
      var editHtml =
        '\n<p class="edit-this-page">' +
        '<a href="' +
        editUrl +
        '" target="_blank" rel="noopener">' +
        label +
        '</a></p>\n';

      next(html + editHtml);
    });
  }

  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(
    window.$docsify.plugins || [],
    pluginFactory
  );
})();
