if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault("counter", 0);

  Template.test.helpers({
  });

  Template.test.events({
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
