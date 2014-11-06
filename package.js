Package.describe({
  name: 'jchristman:window-manager',
  summary: 'Meteor package to easily allow desktop-like applications in meteor',
  version: '1.0.0',
  git: 'https://github.com/suntzuII/meteor-window-manager'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');

  api.use('jquery');
  api.use('underscore');
  api.use('jchristman:context-menu@1.0.0');

  api.addFiles('window-manager.js');
  api.export([
        'WindowManager'
  ], ['client','server']); 
});
