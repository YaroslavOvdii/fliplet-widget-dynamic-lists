var smallHorizontalLayoutMapping = {
  'small-h-card': {
    'base': 'templates.build.small-h-card-base',
    'loop': 'templates.build.small-h-card-loop',
    'detail': 'templates.build.small-h-card-detail',
  }
};

var operators = {
  '==': function(a, b) { return a == b },
  '!=': function(a, b) { return a != b },
  '>': function(a, b) { return a > b },
  '>=': function(a, b) { return a >= b },
  '<': function(a, b) { return a < b },
  '<=': function(a, b) { return a <= b }
};

// Constructor
var DynamicList = function(id, data, container) {
  var _this = this;

  // Makes data and the component container available to Public functions
  this.data = data;
  this.$container = $('[data-dynamic-lists-id="' + id + '"]');
  this.queryOptions = {};

  // Other variables
  // Global variables
  this.allowClick = true;

  this.emailField = 'Email';
  this.myProfileData;
  this.myUserData;

  this.listItems;

  // Register handlebars helpers
  this.profileHTML = this.data.advancedSettings && this.data.advancedSettings.detailHTML
  ? Handlebars.compile(this.data.advancedSettings.detailHTML)
  : Handlebars.compile(Fliplet.Widget.Templates[smallHorizontalLayoutMapping[this.data.layout]['detail']]());

  this.registerHandlebarsHelpers();
  // Get the current session data
  Fliplet.Session.get().then(function(session) {
    if (session && session.entries && session.entries.dataSource) {
      _this.myUserData = session.entries.dataSource.data;
    } else if (session && session.entries && session.entries.saml2) {
      _this.myUserData = session.entries.saml2.user;
      _this.myUserData.isSaml2 = true;
    }
    
    // Start running the Public functions
    _this.initialize();
  });
};

DynamicList.prototype.registerHandlebarsHelpers = function() {
  // Register your handlebars helpers here
  var _this = this;

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });
}

DynamicList.prototype.attachObservers = function() {
  var _this = this;
  // Attach your event listeners here
  _this.$container
    .on('click', '.small-h-card-list-detail-button a', function() {
      var _that = $(this);
       Fliplet.Analytics.trackEvent({
        category: 'list_dynamic_' + _this.data.layout,
        action: 'profile_buttons',
        label: _that.find('.small-h-card-list-detail-button-text').text()
      });
    })
    .on('touchstart', '.small-h-card-list-item', function(event) {
      event.stopPropagation();
      $(this).addClass('hover');
    })
    .on('touchmove', '.small-h-card-list-item', function() {
      _this.allowClick = false;
      $(this).removeClass('hover');
    })
    .on('touchend touchcancel', '.small-h-card-list-item', function() {
      $(this).removeClass('hover');
      // Delay to compensate for the fast click event
      setTimeout(function() {
        _this.allowClick = true;
      }, 100);
    })
    .on('click', '.my-profile-container', function() {
      var directoryDetailWrapper = $(this).find('.small-h-card-list-detail-wrapper');
      _this.expandElement(directoryDetailWrapper);

      Fliplet.Analytics.trackEvent({
        category: 'list_dynamic_' + _this.data.layout,
        action: 'profile_open'
      });
    })
    .on('click', '.small-h-card-list-item', function(event) {
      // find the element to expand and expand it
      if (_this.allowClick) {
        var directoryDetailWrapper = $(this).find('.small-h-card-list-detail-wrapper');
        _this.expandElement(directoryDetailWrapper);
      }

      var entryTitle = $(this).find('.small-h-card-list-item-text').text();
      Fliplet.Analytics.trackEvent({
        category: 'list_dynamic_' + _this.data.layout,
        action: 'entry_open',
        label: entryTitle
      });
    })
    .on('click', '.small-h-card-list-detail-close-btn', function(event) {
      event.stopPropagation();
      // find the element to collpase and collpase it
      var directoryDetailWrapper = $(this).parents('.small-h-card-list-detail-wrapper');
      _this.collapseElement(directoryDetailWrapper);
    })
    .on('click', '.dynamic-list-add-item', function() {
      var options = {
        title: 'Link not configured',
        message: 'Form not found. Please check the component\'s configuration.',
      };

      if (_this.data.addEntryLinkAction) {
        _this.data.addEntryLinkAction.query = '?mode=add';

        if (typeof _this.data.addEntryLinkAction.page !== 'undefined' && _this.data.addEntryLinkAction.page !== '') {
          Fliplet.Navigate.to(_this.data.addEntryLinkAction)
            .catch(function() {
              Fliplet.UI.Toast(options);
            });
        } else {
          FFliplet.UI.Toast(options);
        }
      }
    })
    .on('click', '.dynamic-list-edit-item', function() {
      var entryID = $(this).parents('.small-h-card-list-item').data('entry-id');
      var options = {
        title: 'Link not configured',
        message: 'Form not found. Please check the component\'s configuration.',
      };

      if (_this.data.editEntryLinkAction) {
        _this.data.editEntryLinkAction.query = '?dataSourceEntryId=';

        if (typeof _this.data.editEntryLinkAction.page !== 'undefined' && _this.data.editEntryLinkAction.page !== '') {
          Fliplet.Navigate.to(_this.data.editEntryLinkAction)
            .catch(function() {
              Fliplet.UI.Toast(options);
            });
        } else {
          FFliplet.UI.Toast(options);
        }
      }
    })
    .on('click', '.dynamic-list-delete-item', function() {
      var _that = $(this);
      var entryID = $(this).parents('.small-h-card-list-item').data('entry-id');
      var options = {
        title: 'Are you sure you want to delete the list entry?',
        labels: [
          {
            label: 'Delete',
            action: function (i) {
              Fliplet.DataSources.connect(_this.data.dataSourceId).then(function (connection) {
                return connection.removeById(entryID);
              }).then(function onRemove() {
                _.remove(_this.listItems, function(entry) {
                  return entry.id === parseInt(entryID, 10);
                });

                _that.text('Delete').removeClass('disabled');
                var $closeButton = _that.parents('.small-h-card-list-item').find('.small-h-card-list-detail-close-btn');
                _this.collapseElement($closeButton);
                _this.renderLoopHTML(_this.listItems);
              });
            }
          }
        ],
        cancel: true
      }

      _that.text('Deleting...').addClass('disabled');

      Fliplet.UI.Actions(options);
    });
}

DynamicList.prototype.initialize = function() {
  var _this = this;
  // Render Base HTML template
  _this.renderBaseHTML();

  // Connect to data source to get rows
  _this.connectToDataSource()
    .then(function (records) {
      // Received the rows

      var sorted;
      var ordered;
      var filtered;

      // Prepare sorting
      if (_this.data.sortOptions.length) {
        var fields = [];
        var sortOrder = [];

        _this.data.sortOptions.forEach(function(option) {
          fields.push({
            column: option.column,
            type: option.sortBy
          });

          if (option.orderBy === 'ascending') {
            sortOrder.push('asc');
          }
          if (option.orderBy === 'descending') {
            sortOrder.push('desc');
          }
        });

        // Sort data
        sorted = _.sortBy(records, function (obj) {
          fields.forEach(function(field) {
            obj.data[field.column] = obj.data[field.column] || '';
            var value = obj.data[field.column].toString().toUpperCase();

            if (field.type === "alphabetical") {
              return value.match(/[A-Za-z]/)
              ? value
              : '{' + value;
            }

            if (field.type === "numerical") {
              return value.match(/[0-9]/)
              ? parseInt(value, 10)
              : '{' + value;
            }

            if (field.type === "date") {
              var newDate = new Date(value).getTime();
              return newDate;
            }
          });
        });

        ordered = _.orderBy(sorted, function(record) {
          var values = [];

          fields.forEach(function(field) {
            if (record.data[field.column] !== '' && record.data[field.column] !== null && typeof record.data[field.column] !== 'undefined') {
              values.push(record.data[field.column].toString());
            }
          });

          return values;
        }, sortOrder);
        records = ordered;
      }

      // Prepare filtering
      if (_this.data.filterOptions.length) {
        var filters = [];

        _this.data.filterOptions.forEach(function(option) {
          var filter = {
            column: option.column,
            condition: option.logic,
            value: option.value
          }
          filters.push(filter);
        });

        // Filter data
        filtered = _.filter(records, function(record) {
          var matched = 0;
          

          filters.some(function(filter) {
            var condition = filter.condition;
            // Case insensitive
            if (filter.value !== null && filter.value !== '' && typeof filter.value !== 'undefined') {
              filter.value = filter.value.toLowerCase();
            }
            if (record.data[filter.column] !== null && record.data[filter.column] !== '' && typeof record.data[filter.column] !== 'undefined') {
              record.data[filter.column] = record.data[filter.column].toLowerCase();
            }

            if (condition === 'contains') {
              if (record.data[filter.column].indexOf(filter.value) > -1) {
                matched++;
              }
              return;
            }
            if (condition === 'notcontain') {
              if (record.data[filter.column].indexOf(filter.value) === -1) {
                matched++;
              }
              return;
            }
            if (condition === 'regex') {
              var pattern = new RegExp(filter.value);
              if (patt.test(record.data[filter.column])){
                matched++;
              }
              return;
            }
            if (operators[condition](record.data[filter.column], filter.value)) {
              matched++;
              return;
            }
          });

          return matched >= filters.length ? true : false;
        });
        records = filtered;
      }

      records = _this.getPermissions(records);
      // Make rows available Globally
      _this.listItems = records;

      // Get user profile
      if (_this.myUserData) {
        // Create flag for current user
        records.forEach(function(el, idx) {
          if (el.data[_this.emailField] === (_this.myUserData[_this.emailField] || _this.myUserData['email'])) {
            records[idx].isCurrentUser = true;
          }
        });

        _this.myProfileData = _.filter(records, function(row) {
          return row.isCurrentUser;
        });

        // Remove current user from list on entries
        /*
        _.remove(records, function(row) {
          return row.isCurrentUser;
        });
        */
      }
      
      // Render Loop HTML
      _this.renderLoopHTML(records);
      
      return;
    })
    .then(function() {
      // Listeners and Ready
      _this.attachObservers();
      _this.onReady();
    });
}

DynamicList.prototype.connectToDataSource = function() {
  var _this = this;
  var cache = { offline: true };

  function getData (options) {
    options = options || cache;
    return Fliplet.DataSources.connect(_this.data.dataSourceId, options)
      .then(function (connection) {
        // If you want to do specific queries to return your rows
        // See the documentation here: https://developers.fliplet.com/API/fliplet-datasources.html
        return connection.find(_this.queryOptions);
      });
  }

  return Fliplet.Hooks.run('flListDataBeforeGetData', {
    config: _this.data,
    container: _this.$container
  }).then(function() {
    if (_this.data.getData) {
      getData = _this.data.getData;

      if (_this.data.hasOwnProperty('cache')) {
        cache.offline = _this.data.cache;
      }
    }

    return getData(cache);
  }).catch(function (error) {
    Fliplet.UI.Toast({
      message: 'Error loading data',
      actions: [
        {
          label: 'Details',
          action: function () {
            Fliplet.UI.Toast({
              html: error.message || error
            });
          }
        }
      ]
    });
  });
}

DynamicList.prototype.renderBaseHTML = function() {
  // Function that renders the List container
  var _this = this;
  var baseHTML = '';

  var data = _this.getAddPermission(_this.data);

  if (typeof _this.data.layout !== 'undefined') {
    baseHTML = Fliplet.Widget.Templates[smallHorizontalLayoutMapping[_this.data.layout]['base']];
  }

  var template = _this.data.advancedSettings && _this.data.advancedSettings.baseHTML
  ? Handlebars.compile(_this.data.advancedSettings.baseHTML)
  : Handlebars.compile(baseHTML());

  $('[data-dynamic-lists-id="' + _this.data.id + '"]').html(template(data));
}

DynamicList.prototype.renderLoopHTML = function(records) {
  // Function that renders the List template
  var _this = this;

  records.forEach(function(obj, index) {
    records[index].data.profileHTML = _this.profileHTML(records[index]);
  });

  var template = _this.data.advancedSettings && _this.data.advancedSettings.loopHTML
  ? Handlebars.compile(_this.data.advancedSettings.loopHTML)
  : Handlebars.compile(Fliplet.Widget.Templates[smallHorizontalLayoutMapping[_this.data.layout]['loop']]());

  _this.$container.find('#small-h-card-list-wrapper-' + _this.data.id).html(template(records));
}

DynamicList.prototype.getAddPermission = function(data) {
  var _this = this;

  if (typeof data.addEntry !== 'undefined' && typeof data.addPermissions !== 'undefined') {
    if (_this.myUserData && _this.data.addPermissions === 'admins') {
      if (_this.myUserData[_this.data.userAdminColumn] !== null && typeof _this.myUserData[_this.data.userAdminColumn] !== 'undefined' && _this.myUserData[_this.data.userAdminColumn] !== '') {
        data.showAddEntry = data.addEntry;
      }
    } else if (_this.data.addPermissions === 'everyone') {
      data.showAddEntry = data.addEntry;
    }
  }

  return data;
}

DynamicList.prototype.getPermissions = function(entries) {
  var _this = this;

  // Adds flag for Edit and Delete buttons
  entries.forEach(function(obj, index) {
    if (typeof _this.data.editEntry !== 'undefined' && typeof _this.data.editPermissions !== 'undefined') {
      if (_this.myUserData && _this.data.editPermissions === 'admins') {
        if (_this.myUserData[_this.data.userAdminColumn] !== null && typeof _this.myUserData[_this.data.userAdminColumn] !== 'undefined' && _this.myUserData[_this.data.userAdminColumn] !== '') {
          entries[index].editEntry = _this.data.editEntry;
        }
      } else if (_this.myUserData && _this.data.editPermissions === 'user') {
        if (_this.myUserData[_this.data.userEmailColumn] === obj.data[_this.data.userListEmailColumn]) {
          entries[index].editEntry = _this.data.editEntry;
        }
      } else if (_this.data.addPermissions === 'everyone') {
        entries[index].editEntry = _this.data.editEntry;
      }
    }
    if (typeof _this.data.deleteEntry !== 'undefined' && typeof _this.data.deletePermissions !== 'undefined') {
      if (_this.myUserData && _this.data.deletePermissions === 'admins') {
        if (_this.myUserData[_this.data.userAdminColumn] !== null && typeof _this.myUserData[_this.data.userAdminColumn] !== 'undefined' && _this.myUserData[_this.data.userAdminColumn] !== '') {
          entries[index].deleteEntry = _this.data.deleteEntry;
        }
      } else if (_this.myUserData && _this.data.deletePermissions === 'user') {
        if (_this.myUserData[_this.data.userEmailColumn] === obj.data[_this.data.userListEmailColumn]) {
          entries[index].deleteEntry = _this.data.deleteEntry;
        }
      } else if (_this.data.deletePermissions === 'everyone') {
        entries[index].deleteEntry = _this.data.deleteEntry;
      }
    }
  });

  return entries;
}

DynamicList.prototype.onReady = function() {
  // Function called when it's ready to show the list and remove the Loading
  var _this = this;

  // Ready
  _this.$container.find('.new-small-h-card-list-container').addClass('ready');
}

DynamicList.prototype.expandElement = function(elementToExpand) {
  // Function called when a list item is tapped to expand
  var _this = this;

  // This bit of code will only be useful if this component is added inside a Fliplet's Accordion component
  if (elementToExpand.parents('.panel-group').length) {
    elementToExpand.parents('.panel-group').addClass('remove-transform');
  }

  //check to see if element is already expanded
  if (!elementToExpand.hasClass('open')) {
    var currentPosition = elementToExpand.offset();
    var elementScrollTop = $(window).scrollTop();
    var netOffset = currentPosition.top - elementScrollTop;

    var expandPosition = $('body').offset();
    var expandTop = expandPosition.top;
    var expandLeft = expandPosition.left;
    var expandWidth = $('body').outerWidth();
    var expandHeight = $('body').outerHeight();

    var directoryDetailImageWrapper = elementToExpand.find('.small-h-card-list-detail-image-wrapper');
    var directoryDetailImage = elementToExpand.find('.small-h-card-list-detail-image');

    // freeze the current scroll position of the background content
    $('body').addClass('lock');

    // convert the expand-item to fixed position with a high z-index without moving it 
    elementToExpand.css({
      'top': netOffset,
      'left': currentPosition.left,
      'height': elementToExpand.height(),
      'width': elementToExpand.width(),
      'max-width': expandWidth,
      'position': 'fixed',
      'z-index': 11,
    });

    elementToExpand.animate({
      'left': expandLeft,
      'top': expandTop,
      'height': expandHeight,
      'width': expandWidth,
      'max-width': expandWidth
    }, 200, 'swing');

    elementToExpand.addClass('open');
    elementToExpand.find('.small-h-card-list-detail-close-btn').addClass('open');
    elementToExpand.find('.small-h-card-list-detail-content-scroll-wrapper').addClass('open');

    directoryDetailImageWrapper.css({
      height: directoryDetailImageWrapper.outerHeight(),
      'z-index': 12
    });

    directoryDetailImageWrapper.animate({
      height: '100vw'
    },
    200,
    'swing'
    );

    directoryDetailImage.css({
      height: directoryDetailImage.outerHeight(),
      'z-index': 12
    });

    directoryDetailImage.animate({
      height: '100vw'
    }, 200, 'swing');
  }
}

DynamicList.prototype.collapseElement = function(elementToCollapse) {
  // Function called when a list item is tapped to close
  var _this = this;

  $('body').removeClass('lock');

  var directoryDetailImageWrapper = elementToCollapse.find('.small-h-card-list-detail-image-wrapper');
  var directoryDetailImage = elementToCollapse.find('.small-h-card-list-detail-image');

  var collapseTarget = elementToCollapse.parent();
  var elementScrollTop = $(window).scrollTop();
  var targetCollpsePlaceholderTop = collapseTarget.offset().top - elementScrollTop;
  var targetCollpsePlaceholderLeft = collapseTarget.offset().left;
  var targetCollapseHeight = collapseTarget.outerHeight();
  var targetCollapseWidth = collapseTarget.outerWidth();

  elementToCollapse.animate({
    top: targetCollpsePlaceholderTop,
    left: targetCollpsePlaceholderLeft,
    height: targetCollapseHeight,
    width: targetCollapseWidth
  }, 200, 'linear',
  function() {
    elementToCollapse.css({
      // after animating convert the collpase item to position absolute with a low z-index without moving it 
      'position': 'absolute',
      'z-index': '1',
      'top': 0,
      'left': 0,
      'height': '100%',
      'width': '100%',
    });
  });

  directoryDetailImageWrapper.animate({
    height: targetCollapseHeight
  }, 200, 'linear');

  directoryDetailImage.animate({
    height: targetCollapseHeight
  }, 200, 'linear',
  function() {
    elementToCollapse.css({ height: '100%', });

    // This bit of code will only be useful if this component is added inside a Fliplet's Accordion component
    // Only happens when the closing animation finishes
    if (elementToCollapse.parents('.panel-group').length) {
      elementToCollapse.parents('.panel-group').removeClass('remove-transform');
    }
  });

  elementToCollapse.removeClass('open');
  elementToCollapse.find('.small-h-card-list-detail-close-btn').removeClass('open');
  elementToCollapse.find('.small-h-card-list-detail-content-scroll-wrapper').removeClass('open');
}