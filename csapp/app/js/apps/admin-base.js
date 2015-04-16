App = Ember.Application.create({
	// for debugging, disable in prod
	LOG_TRANSITIONS: true,
	LOG_ACTIVE_GENERATION: true
});

App.Router.map(function() {
	this.resource('login');
	this.resource('logout');
	// this.resource('apps');
	this.resource('appstore');
	this.resource('installedapps');
	this.resource('selectedapp', {path: '/appstore/:appname'});
	this.resource('email', function () {
		this.route('domains');
		this.resource('aliases', function() {
			this.route('new');
		});
		this.resource('alias', { path: '/alias/:alias_name' });
	});
	this.resource('accounts');
	this.resource('addAccount');
	this.resource('manageAccount', { path: '/accounts/:name' } , function() {
		this.route('adminChangePassword', { path: '/admin_change_password' });
	});

	this.resource('security', function() {
		this.resource('certs', function() {
			this.route('new');
		});
		this.resource('cert', { path: '/cert/:cert_name' });
	});

	this.resource('groups', function () {
		this.resource('delete', { path: '/group/delete/:group_name' });
	});

	this.route('groupsNew', { path: "/groups/new/" });
	this.route('group', { path: '/group/:group_name' });

	this.resource('valet_keys');
	this.resource('app_settings');
	this.resource('app_setting', { path: '/app_settings/:app_name' });
	this.resource('config_app', { path: '/config/:appname' });
	this.resource('confirm_config_app', { path: '/confirm/:appname' });
	this.resource('install_app', { path: '/install/:appname' });

	// this.resource('addCloud', { path: '/add_cloud/:cloud_type' });
	// this.resource('configCloud', { path: '/cloud/:cloud_name' });
});

App.ApplicationRoute = Ember.Route.extend({
	model: function() {
		return {
			cloudos_session: CloudOsStorage.getItem('cloudos_session'),
			cloudos_account: CloudOs.account()
		};
	},
	setupController: function(controller, model) {

		// is HTML5 storage even supported?
		if (typeof(Storage) == "undefined") {
			alert('Your browser is not supported. Please use Firefox, Chrome, Safari 4+, or IE8+');
			return;
		}

		// do we have an API token?
		if (!model.cloudos_session) {
			this.transitionTo('login');
			// window.location.replace('/index.html');
			return;
		}

		// is the token valid?
		var account = Api.account_for_token(model.cloudos_session);
		if (Ember.isNone(account)) {
			CloudOs.logout();
			this.transitionTo('login');
			// window.location.replace('/index.html');
			return;
		}

		// is not an admin
		if (!account.admin) {
			NotificationStack.push('not_authorized');
			window.location.replace('/index.html');
			return;
		}

		CloudOs.set_account(account);
		pathArray = window.location.href.split( '/' );
		if (((pathArray[3] == '') || (pathArray[3] == '#') || (pathArray[3] == 'admin.html')) && (!pathArray[4]))
		{
			this.transitionTo('accounts');
		}

	}
});

App.ApplicationController = Ember.ObjectController.extend({

	cloudos_session: CloudOsStorage.getItem('cloudos_session'),
	cloudos_account: CloudOs.account(),

	actions: {
		'select_app': function (app_name) {
			window.location.replace('/#/app/' + app_name);
		}
	},
	refreshAuthStatus: function() {
		this.set('cloudos_session', CloudOsStorage.getItem('cloudos_session'));
		this.set('cloudos_account', CloudOs.account());
	},

	reInitializeZurb: function() {
		Ember.run.scheduleOnce('afterRender', initialize_zurb);
	}.observes("cloudos_session", "cloudos_account")

});

App.ApplicationView = Ember.View.extend({
	initFoundation: initialize_zurb.on('didInsertElement')
});

App.IndexRoute = App.ApplicationRoute;
