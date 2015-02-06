Package.describe({
  name: 'jchristman:window-manager',
  summary: 'Deprecated: use jchristman:application-manager',
  version: '1.0.2',
  git: 'https://github.com/jchristman/meteor-window-manager'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');

  api.use('accounts-base',['client','server']);
  api.use('underscore');
  api.use('templating', 'client');
  api.use('jquery','client');
  api.use('mizzao:jquery-ui@1.11.2','client')
  api.use('jchristman:context-menu@1.1.2_4','client');

  api.addFiles([
      'lib/WindowManager.js',
      'collections/WMCollection.js',
  ],['client','server']);

  api.addFiles([
      'lib/Window.js',
      'lib/style.css',
      'lib/context-menus/tab-context-menu-config.js',
      'lib/context-menus/pane-context-menu-config.js',
      'lib/context-menus/context-menu-funcs.js',
      'lib/template/WindowsTemplates.html',
      'lib/template/WindowsTemplates.js'
  ],['client']);

  api.export([
        'WM',
        'WindowManager',
        'WMCollection',
        'CONTEXT_MENU_FUNCS'
  ], ['client','server']); 
});
