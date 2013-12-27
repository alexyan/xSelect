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
})(jQuery);;

function jsonPath(obj, expr, arg) {
    var P = {
        resultType: arg && arg.resultType || "VALUE",
        result: [],
        normalize: function (expr) {
            var subx = [];
            return expr.replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
                return "[#" + (subx.push($1) - 1) + "]";
            }).replace(/'?\.'?|\['?/g, ";").replace(/;;;|;;/g, ";..;").replace(/;$|'?\]|'$/g, "").replace(/#([0-9]+)/g, function ($0, $1) {
                return subx[$1];
            });
        },
        asPath: function (path) {
            var x = path.split(";"),
                p = "$";
            for (var i = 1, n = x.length; i < n; i++)
                p += /^[0-9*]+$/.test(x[i]) ? ("[" + x[i] + "]") : ("['" + x[i] + "']");
            return p;
        },
        store: function (p, v) {
            if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
            return !!p;
        },
        trace: function (expr, val, path) {
            if (expr) {
                var x = expr.split(";"),
                    loc = x.shift();
                x = x.join(";");
                if (val && val.hasOwnProperty(loc))
                    P.trace(x, val[loc], path + ";" + loc);
                else if (loc === "*")
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        P.trace(m + ";" + x, v, p);
                    });
                else if (loc === "..") {
                    P.trace(x, val, path);
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        typeof v[m] === "object" && P.trace("..;" + x, v[m], p + ";" + m);
                    });
                } else if (/,/.test(loc)) {
                    for (var s = loc.split(/'?,'?/), i = 0, n = s.length; i < n; i++)
                        P.trace(s[i] + ";" + x, val, path);
                } else if (/^\(.*?\)$/.test(loc))
                    P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";") + 1)) + ";" + x, val, path);
                else if (/^\?\(.*?\)$/.test(loc))
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        if (P.eval(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) P.trace(m + ";" + x, v, p);
                    });
                else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc))
                    P.slice(loc, x, val, path);
            } else
                P.store(path, val);
        },
        walk: function (loc, expr, val, path, f) {
            if (val instanceof Array) {
                for (var i = 0, n = val.length; i < n; i++)
                    if (i in val)
                        f(i, loc, expr, val, path);
            } else if (typeof val === "object") {
                for (var m in val)
                    if (val.hasOwnProperty(m))
                        f(m, loc, expr, val, path);
            }
        },
        slice: function (loc, expr, val, path) {
            if (val instanceof Array) {
                var len = val.length,
                    start = 0,
                    end = len,
                    step = 1;
                loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function ($0, $1, $2, $3) {
                    start = parseInt($1 || start);
                    end = parseInt($2 || end);
                    step = parseInt($3 || step);
                });
                start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                end = (end < 0) ? Math.max(0, end + len) : Math.min(len, end);
                for (var i = start; i < end; i += step)
                    P.trace(i + ";" + expr, val, path);
            }
        },
        eval: function (x, _v, _vname) {
            try {
                return $ && _v && eval(x.replace(/@/g, "_v"));
            } catch (e) {
                throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/@/g, "_v").replace(/\^/g, "_a"));
            }
        }
    };
    var $ = obj;
    if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
        P.trace(P.normalize(expr).replace(/^\$;/, ""), obj, "$");
        return P.result.length ? P.result : false;
    }
}
