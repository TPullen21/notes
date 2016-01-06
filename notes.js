Notes = new Mongo.Collection("notes");
 
if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("notes", function () {
    return Notes.find({
      $or: [
        { owner: this.userId }
      ]
    });
  });
}
 
if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("notes");

  Template.body.helpers({
    notes: function () {
        return Notes.find({}, {sort: {createdAt: -1}});
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    currentNoteText: function () {
      return Session.get("currentNoteText");
    },
    currentNoteTitle: function () {
      return Session.get("currentNoteTitle");
    },
    currentNoteId: function () {
      return Session.get("currentNoteId");
    }
  });

  Template.body.events({
    "click .new-note": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get values from form element
      var title = "";//event.target.title.value;
      var text = "";//event.target.text.value;
 
      // Insert a note into the collection
      Meteor.call("addNote", title, text);
 
      // Clear form
      //event.target.text.value = "";
    },
    "submit .update-note": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get values from form element
      var title = event.target.title.value;
      var text = event.target.text.value;
 
      // Insert a note into the collection
      Meteor.call("updateNote", Session.get("currentNoteId"), title, text);
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    },
    "click .notePreview": function (event) {
      Session.set("currentNoteText", this.text);
      Session.set("currentNoteTitle", this.title);
      Session.set("currentNoteId", this._id);
    },
    "click #delete": function () {
      console.log("Deleting");
      Meteor.call("deleteNote", Session.get("currentNoteId"));
    }
  });
 
  Template.note.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Template.registerHelper('trunc', function(passedString) {
    var text = passedString.substring(0,50);
    return new Spacebars.SafeString(text)
  });
 
  Template.note.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      console.log("Deleting");
      Meteor.call("deleteNote", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });
 
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}
 
Meteor.methods({
  addNote: function (title, text) {
    // Make sure the user is logged in before inserting a note
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Notes.insert({
      title: title,
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteNote: function (noteId) {
    var note = Notes.findOne(noteId);
    if (typeof(note) === "undefined" || !note) {
      throw new Meteor.Error("not-authorized");
    };
    if (note.private && note.owner !== Meteor.userId()) {
      // If the note is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Notes.remove(noteId);
  },
  updateNote: function (noteId, title, text) {
    var note = Notes.findOne(noteId);
    if (note.owner !== Meteor.userId()) {
      // If the note is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
    
    Notes.update(noteId, { $set: { text: text, title: title } });
  },
  setChecked: function (noteId, setChecked) {
    var note = Notes.findOne(noteId);
    if (note.private && note.owner !== Meteor.userId()) {
      // If the note is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
    
    Notes.update(noteId, { $set: { checked: setChecked} });
  },
  setPrivate: function (noteId, setToPrivate) {
    var note = Notes.findOne(noteId);
 
    // Make sure only the note owner can make a note private
    if (note.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Notes.update(noteId, { $set: { private: setToPrivate } });
  }
});