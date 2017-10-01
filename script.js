(function($) {	
	function IWatchedIt() {
		this.data = [];
		this.settings = {};

		var _iwatchedit = window.localStorage.getItem('_iwatchedit');
		if(_iwatchedit !== null) {
			_iwatchedit = JSON.parse(_iwatchedit);
			this.data = _iwatchedit['data'];
			this.settings = _iwatchedit['settings'];
		} else {
			window.localStorage.setItem('_iwatchedit', JSON.stringify({data: [], settings: {}}));
		}

		this.activeShowIndex = -1;
		this.activeSeasonIndex = -1;
		this.activeEpisodeIndex = -1;

		this.activeShowId = null;
		this.activeSeasonId = null;

		this.addAsWatched = typeof this.settings.addAsWatched !== 'undefined' ? this.settings.addAsWatched : 0;

		this.showItemTemp = Handlebars.compile($('#show-item').html());
		this.seasonItemTemp = Handlebars.compile($('#season-item').html());
		this.episodeItemTemp = Handlebars.compile($('#episode-item').html());
		this.showFormTemp = Handlebars.compile($('#show-form-temp').html());

		this.$body = $('body');
		this.$showList = $('#show-list');
		this.$seasonList = $('#season-list');
		this.$episodeList = $('#episode-list');

		this.init();

		$('#add-as-watched').prop('checked', this.addAsWatched);
	}

	IWatchedIt.prototype.init = function() {
		this.bodyEvents();
		this.renderShowList();
		this.addEvents();
	};

	IWatchedIt.prototype.renderShowList = function(refresh) {
		var self = this;
		var output = '';
		if(refresh) {
			var _iwatchedit = window.localStorage.getItem('_iwatchedit');
			if(_iwatchedit !== null) {
				_iwatchedit = JSON.parse(_iwatchedit);
				this.data = _iwatchedit['data'];
				this.settings = _iwatchedit['settings'];
			} else {
				window.localStorage.setItem('_iwatchedit', JSON.stringify({data: [], settings: {}}));
			}
		}
		this.data.forEach(function(i) {
			output += self.showItemTemp(i);
		});
		this.$showList.html(output);
		if(this.data.length) {
			this.$body.trigger('show:loaded').trigger('show:hasitem');
		} else {
			this.$body.trigger('show:loaded').trigger('show:empty');
		}
	};

	IWatchedIt.prototype.renderSeasonList = function() {
		var self = this;
		if(typeof this.data[this.activeShowIndex].sns === 'undefined') {
			return;
		}
		var out = '';
		this.data[this.activeShowIndex].sns.forEach(function(item, index, arr) {
			var itemCopy = $.extend({}, item);
			itemCopy.last = false;
			if(index+1 === arr.length) itemCopy.last = true;
			out += self.seasonItemTemp(itemCopy);
		});
		this.$seasonList.html(out);
		if(out === '') {
			this.$body.trigger('season:loaded').trigger('season:empty');
		} else {
			this.$body.trigger('season:loaded').trigger('season:hasitem');
		}
	};

	IWatchedIt.prototype.renderEpisodeList = function() {
		var self = this;
		if(typeof this.data[this.activeShowIndex].sns[this.activeSeasonIndex].eps === 'undefined') {
			return;
		}
		var out = '';
		this.data[this.activeShowIndex].sns[this.activeSeasonIndex].eps.forEach(function(item, index, arr) {
			var itemCopy = $.extend({}, item);
			itemCopy.last = false;
			if(index+1 === arr.length) itemCopy.last = true;
			out += self.episodeItemTemp(itemCopy);
		});
		this.$episodeList.html(out);
		if(out === '') {
			this.$body.trigger('episode:loaded').trigger('episode:empty');
		} else {
			this.$body.trigger('episode:loaded').trigger('episode:hasitem');
		}
	}

	IWatchedIt.prototype.getTheItem = function(id, data, type) {
		data = typeof data === 'undefined' ? this.data : data[type];
		return _.find(data, function(item) {
			return item.i === id;
		});
	};

	IWatchedIt.prototype.getShowIndex = function(id) {
		return _.findIndex(this.data, function(item) {
			return item.i === id;
		});
	};

	IWatchedIt.prototype.getSeasonIndex = function(id) {
		return _.findIndex(this.data[this.activeShowIndex].sns, function(item) {
			return item.i === id;
		});
	};

	IWatchedIt.prototype.getEpisodeIndex = function(id) {
		return _.findIndex(this.data[this.activeShowIndex].sns[this.activeSeasonIndex].eps, function(item) {
			return item.i === id;
		});
	};

	IWatchedIt.prototype.makeActive = function($el) {
		$el.siblings('.active').removeClass('active');
		$el.addClass('active');
	};

	IWatchedIt.prototype.addEvents = function() {
		var self = this;
		this.$showList.on('click', 'li', function(e) {
			var $this = $(this), id = $this.data('show');
			if(id === self.activeShowId) return false;
			self.makeActive($this);
			var index = self.getShowIndex(id);
			if(index !== -1) {
				self.activeShowIndex = index;
				self.activeShowId = id;
				self.renderSeasonList(index);
				self.$body.trigger('show:selected');
			}
		});

		this.$seasonList.on('click', 'li', function(e) {
			var $this = $(this), id = $this.data('season');
			if(id === self.activeSeasonId) return false;
			self.makeActive($this);
			var index = self.getSeasonIndex(id);
			if(index !== -1) {
				self.activeSeasonIndex = index;
				self.activeSeasonId = id;
				self.renderEpisodeList();
			}
		});

		this.$showList.on('click', '.show-delete', function(e) {
			e.preventDefault();
			if(!confirm('Are you sure you want to delete the show?')) return false;
			var id = $(this).closest('li').data('show');
			var index = self.getShowIndex(id)
			self.data.splice(index, 1);
			self.$body.trigger('show:reload').trigger('update');
			e.stopPropagation();
		});

		this.$seasonList.on('click', '.season-delete', function(e) {
			e.preventDefault();
			if(!confirm('Are you sure you want to delete the season?')) return false;
			var id = $(this).closest('li').data('season');
			var index = self.getSeasonIndex(id)
			self.data[self.activeShowIndex].sns.splice(index, 1);
			self.$body.trigger('season:reload').trigger('update');
			e.stopPropagation();
		});

		this.$episodeList.on('click', '.episode-delete', function(e) {
			e.preventDefault();
			var id = $(this).closest('li').data('episode');
			var index = self.getEpisodeIndex(id)
			self.data[self.activeShowIndex].sns[self.activeSeasonIndex].eps.splice(index, 1);
			self.$body.trigger('episode:reload').trigger('update');
			e.stopPropagation();
		});

		$('#add-episode').on('click', function(e) {
			e.preventDefault();
			self.addNewEpisode();
		});

		$('#add-season').on('click', function(e) {
			e.preventDefault();
			self.addNewSeason();
		});

		$('#add-show-btn').on('click', function(e) {
			var htm = self.showFormTemp();
			$('.show-form-wrapper').html(htm);
		});

		this.$episodeList.on('change', '.custom-control-input', function(e) {
			var id = $(this).closest('li').data('episode');
			var epIndex = self.getEpisodeIndex(id);
			self.data[self.activeShowIndex].sns[self.activeSeasonIndex].eps[epIndex].w = +this.checked;
			self.$body.trigger('update');
		});

		$('#add-as-watched').on('change', function() {
			self.settings.addAsWatched = self.addAsWatched = +this.checked;
			self.$body.trigger('update');
		});

		this.$body.on('submit', '.show-form', function(e) {
			e.preventDefault();
			var $this = $(this), name = $this.find('#new-show-name');
			if(name.val().length) {
				self.addNewShow(name.val());
			}
			name.val('');
		});

		// export shows
		$('#export').on('click', function(e) {

		});

		$('#imex-modal').on('show.bs.modal', function(e) {
			var type = $(e.relatedTarget).data('type'); 
			$(this).addClass(type);
			if(type==='export-modal') {
				var data = window.localStorage.getItem('_iwatchedit') || '';
				$('#imex-input').val(data);
			}
		});

		$('#import-btn').on('click', function(e) {
			e.preventDefault();
			window.localStorage.setItem('_iwatchedit', $('#imex-input').val());
			$('#imex-modal').modal('hide');
			self.renderShowList(true);
			self.$body.trigger('season:unfocus').trigger('episode:unfocus');
		});

		$('#imex-modal').on('hide.bs.modal', function(e) {
			var $link = $(e.relatedTarget); 
			$(this).removeClass($link.data('type'));
			$(this).find('#imex-input').val('');
		});

		$('#empty').on('click', function(e) {
			e.preventDefault();
			if(confirm('Are you sure you want to delete all show?')) {
				window.localStorage.setItem('_iwatchedit', JSON.stringify({data: [], settings: {}}));
				self.renderShowList(true);
				self.$body.trigger('season:unfocus').trigger('episode:unfocus');	
			}
		})


	};

	IWatchedIt.prototype.addNewShow = function(name) {
		var index = this.data.length, id = this.topId();
		var newSh = {i: id, n: name, sns: []};
		this.data[index] = newSh;
		this.$body.trigger('show:reload').trigger('update');
	};

	IWatchedIt.prototype.addNewSeason = function() {
		var seasons = this.data[this.activeShowIndex].sns;
		var newSe = {i: seasons.length+1, eps: []};
		this.data[this.activeShowIndex].sns[seasons.length] = newSe;
		this.renderSeasonList();
		this.$body.trigger('update');
	};

	IWatchedIt.prototype.addNewEpisode = function() {
		var episodes = this.data[this.activeShowIndex].sns[this.activeSeasonIndex].eps;
		var newEp = {i: episodes.length+1, w: 0};
		if(this.addAsWatched) newEp.w = 1;
		this.data[this.activeShowIndex].sns[this.activeSeasonIndex].eps[episodes.length] = newEp;
		this.renderEpisodeList();
		this.$body.trigger('update');
	};

	IWatchedIt.prototype.topId = function(type) {
		return this.data.length > 0 ? +this.data[this.data.length-1].i + 1 : 1;
	};

	IWatchedIt.prototype.bodyEvents = function() {
		var self = this;
		this.$body.on('update', function() {
			var dump = JSON.stringify({data: self.data, settings: self.settings});
			window.localStorage.setItem('_iwatchedit', dump);
		});

		this.$body.on('show:loaded', function() {
			$(this).addClass('show-loaded');
		});
		this.$body.on('show:empty', function() {
			$(this).addClass('show-empty');
		});
		this.$body.on('show:hasitem', function() {
			$(this).removeClass('show-empty');
		});
		this.$body.on('show:selected', function() {
			self.$body.trigger('episode:unfocus');
		});
		this.$body.on('show:reload', function() {
			self.renderShowList();
			self.$body.trigger('season:unfocus').trigger('episode:unfocus');
		});

		this.$body.on('season:loaded', function() {
			$(this).addClass('season-loaded');
		});
		this.$body.on('season:empty', function() {
			$(this).addClass('season-empty');
		});
		this.$body.on('season:hasitem', function() {
			$(this).removeClass('season-empty');
		});
		this.$body.on('season:unfocus', function() {
			self.$body.removeClass('season-loaded season-empty');
			self.$seasonList.empty();
		});
		this.$body.on('season:reload', function() {
			self.renderSeasonList(self.activeShowIndex);
			self.$body.trigger('episode:unfocus');
		});

		this.$body.on('episode:loaded', function() {
			$(this).addClass('episode-loaded');
		});
		this.$body.on('episode:empty', function() {
			$(this).addClass('episode-empty');
		});
		this.$body.on('episode:hasitem', function() {
			$(this).removeClass('episode-empty');
		});
		this.$body.on('episode:unfocus', function() {
			self.$body.removeClass('episode-loaded episode-empty');
			self.$episodeList.empty();
			self.activeSeasonId = null;
		});
		this.$body.on('episode:reload', function() {
			self.renderEpisodeList();
			// self.$body.trigger('episode:unfocus');
		});
	};



	$(document).ready(function() {
		var iWatchedIt = new IWatchedIt();
	});

})(jQuery);