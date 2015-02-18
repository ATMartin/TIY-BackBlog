var $container = $('#app-container'),
    $templatePostNew = $('[data-template-name="new-post"]').text(),
    $templatePostListing = $('[data-template-name="post-list"]').text(),
    $templatePostFull = $('[data-template-name="post-full"]').text();

var REMOTE_SERVER = "http://tiny-pizza-server.herokuapp.com/collections/atmbackbone";

//HELPER METHODS

var toggleEdit = function(selector, modelProp, context) {
    if (context.$(selector).attr('contenteditable')) {
      context.$(selector).removeAttr('contenteditable');
      context.model.set(modelProp, context.$(selector).text());
      context.model.set('updatedAt', new Date().toString());
      context.model.save();
    } else {
      context.$(selector).attr('contenteditable', true);
      context.$(selector).focus();
    }
};

var toggleEditButton = function($button) {
  if ($button.hasClass('octicon-pencil')) { 
    $button.removeClass('octicon-pencil');
    $button.addClass('octicon-check');
  } else {
    $button.removeClass('octicon-check');
    $button.addClass('octicon-pencil');
  }
};


//BACKBONE BEGINS
var PostModel = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: function(options) {
      options = options || {};
      return _.defaults(options, {
        title: '',
        body: '',
        author: 'Alex',
        createdAt: new Date().toString(),
        updatedAt: new Date().toString()
      })
    }
});

var PostCollection = Backbone.Collection.extend({
  model: PostModel,  
  url: REMOTE_SERVER
});


var PostViewFull = Backbone.View.extend({
  className: 'js-post-full',
  template: _.template($templatePostFull),
  events: {
    'click .js-destroy' : 'destroyMe',
    'click .js-edit' : 'editMe'
  },
  destroyMe: function(e) {
    e.preventDefault();
    this.model.destroy().done(function() {
      AppRouter.navigate("/", {trigger: true});
    });
  },
  editMe: function(e) {
    e.preventDefault();
    toggleEditButton(this.$('.js-edit'));
    toggleEdit('.wrapper-body', 'body', this);
    toggleEdit('.wrapper-title', 'title', this);
  },
  render: function() {
    this.$el.html( this.template (this.model.toJSON() ) );
    return this;
  }
});

var PostViewList = Backbone.View.extend({
  tagName: 'ul',
  className: 'js-post-list',
  initialize: function() {
    this.listenTo(this.collection, 'sync destroy', this.render);
  },
  render: function() {
    this.$el.empty();
    var self = this;
    this.collection.each(function(post) {
      var newPost = new PostViewListing({model: post}); 
      newPost.render();
      self.$el.append(newPost.el);
    });
    $container.append(this.el);
  }
});

var PostViewListing = Backbone.View.extend({
  tagName: 'li',
  className: 'js-post-listing',
  template: _.template($templatePostListing),
  events: {
    'click .js-destroy':'destroyMe',
    'click .js-edit':'editMe'
  },
  destroyMe: function(e) {
    e.preventDefault();
    this.model.destroy();  
  },
  editMe: function(e) {
    e.preventDefault();
    toggleEditButton(this.$('.js-edit'));
    toggleEdit('.wrapper-title', 'title', this);
  },
  render: function() {
    this.$el.html( this.template(this.model.toJSON() ) );
    return this;
  }
});

var PostViewNew = Backbone.View.extend({
  tagName: 'form', 
  className: 'js-new-post', 
  template: _.template($templatePostNew),
  events: {
    'submit': 'createPost'
  },
  createPost: function(e) {
    e.preventDefault();
    var newTitle = this.$(".new-title").val();
    var newBody = this.$(".new-body").val();
    this.collection.create({title: newTitle, body: newBody});
    this.$(".new-title").val('');
    this.$(".new-body").val('');
  },
  render: function() {
    this.$el.html( this.template({}) );
    return this;
  }  
});

var BlogRouter = Backbone.Router.extend({
  routes: {
    '':'index',
    'posts/:id':'post'  
  },
  initialize: function() {
    this.collection = new PostCollection();
    this.postViewList = new PostViewList({collection: this.collection});
    this.postNew = new PostViewNew({collection: this.collection});
  },
  index: function() {
    this.collection.fetch();
    this.postNew.render();
    this.postViewList.render();
    $container.removeClass('expanded');
    $container.html(this.postViewList.$el);
    $container.append(this.postNew.$el);  
  },
  
  post: function(id) {
    var self = this;
    this.collection.fetch().done(function() {
      var thisModel = self.collection.get(id);
      var postFull = new PostViewFull({model: thisModel});
      postFull.render();
      $container.addClass('expanded');
      $container.html(postFull.$el); 
    });
  }
    
}); 

$(document).ready(function() {
  window.AppRouter = new BlogRouter();
  Backbone.history.start();
});
