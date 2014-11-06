Package.describe({
  name: 'jchristman:window-manager',
  summary: 'Meteor package to easily allow desktop-like applications in meteor',
  version: '1.0.0',
  git: 'https://github.com/suntzuII/meteor-window-manager'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');

  api.use('accounts-base',['client','server']);
  api.use('underscore');
  api.use('templating', 'client');
  api.use('jchristman:context-menu@1.0.0','client');

  api.addFiles([
      'window-manager.js',
      'window-manager-collection.js',
  ],['client','server']);

  api.addFiles([
      'windows.html',
      'windows.js',
      'windows.css'
  ],['client']);

  api.export([
        'WindowManager',
        'WMCollection'
  ], ['client','server']); 
});
