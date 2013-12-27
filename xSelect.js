(function ($) {
    $.extend({
        _xSelect: {
            initComplete: false,
            options: {
                noneValue: 0,
                vessel: '#xSelect-vessel',
                cssClass: 'x-select',
                events: {
                    onXChange: function () {
                        var that = this;
                        that.owner.val(that.valueSelector.val() + '..' + that.valueSelector.find('option:selected').text());
                    }
                },
                dataMap: '',
                dataMapSplitter: '-',
                setPrefixOption: function () {
                    var that = this;
                    var option = $('<option/>').html('== 请选择 ==');
                    option.val(that.options.noneValue);
                    return option;
                },
                autoPrefixOption: true
            },
            getCssClass: function (classname) {
                return '.' + classname;
            },
            parseData: function (data, val) {
                var that = this;
                return jsonPath(data, "$..[" + val + "]['subset']") && (function () {
                    return jsonPath(data, "$..[" + val + "]['subset']")[0];
                })();
            },
            getValueSelector: function () {
                var that = this;
                var value = 0,
                    selector = $('select');
                $.each($(that.options.vessel).find(that.getCssClass(that.options.cssClass)), function (key, item) {
                    if ($(item).attr('value') != that.options.noneValue) {
                        value = $(item).attr('value') || 0;
                        selector = $(item);
                    }
                });
                return selector;
            },
            getKeyPath: function (data, key, options) {
                options = options || {
                    resultType: "VALUE"
                };
                var keyPath = jsonPath(data, "$..[" + key + "]", options) && (function () {
                    return jsonPath(data, "$..[" + key + "]", options)[0];
                })();
                return keyPath;
            },
            getDataPath: function () {
                var that = this;
                that.dataPath = that.getKeyPath(that.data, that.owner.val(), {
                    resultType: "PATH"
                });
            },
            assemble: function (data) {
                var that = this;
                data = data || {}, dataLen = _.keys(data).length;
                dataLen && (function () {
                    var select = $('<select/>');
                    that.options.cssClass && (function () {
                        select.addClass(that.options.cssClass);
                    })(); !! that.options.autoPrefixOption && (function () {
                        var prefixOpiton = that.options.setPrefixOption.apply(that);
                        prefixOpiton.prependTo(select);
                    })();
                    $.each(data, function (key, item) {
                        var keyPath = that.getKeyPath(that.data, key, {
                            resultType: "PATH"
                        });
                        var option = $('<option/>').attr({
                            'value': key || that.options.noneValue,
                            'data-keyPath': keyPath
                        }).html(item.text);
                        !that.initComplete && that.dataPath && (function () {
                            if (that.dataPath.indexOf(keyPath) > -1) {
                                option.attr('selected', true);
                            }
                        })();
                        option.appendTo(select);
                        if (that.dataPath == keyPath) that.initComplete = true;
                    });
                    select.appendTo(that.owner.parent());
                    select.bind('x-change', function () {
                        that.options.events.onXChange.apply(that);
                        var selectedOption = select.find('option:selected');
                        var onSelected = jsonPath(data, "$..[" + selectedOption.val() + "]['onSelected']");
                        onSelected && onSelected[0] && 'function' == typeof onSelected[0] && (function () {
                            onSelected[0].apply(that);
                        })();
                    }).bind('change', function () {
                        select.nextAll().remove();
                        var selectedOption = select.find('option:selected');
                        var newdata = that.parseData(data, selectedOption.val());
                        that.valueSelector = that.getValueSelector();
                        newdata && (function () {
                            that.assemble(newdata);
                        })();
                        select.trigger('x-change');
                    }).trigger('change');
                    return true;
                })() || (function () {
                    var select = $('<select/>'); !! that.options.autoPrefixOption && (function () {
                        var prefixOpiton = that.options.setPrefixOption.apply(that);
                        prefixOpiton.prependTo(select);
                    })();
                    select.appendTo(that.owner.parent());
                })();
            },
            init: function (owner, data, options) {
                var that = this;
                that.owner = owner;
                var parent = that.owner.parent();
                var container = $('<div/>').attr('id', 'xSelect-vessel');
                that.owner.appendTo(container);
                container.prependTo(parent);
                that.data = data;
                that.options = $.extend(that.options, options);
                that.getDataPath();
                that.assemble(that.data);
                return that.owner;
            }
        }
    });
    $.fn.extend({
        xSelect: function (data, options) {
            return $._xSelect.init(this, data, options || {});
        }
    });
})(jQuery);
