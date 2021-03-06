define(function (require, exports, module) {
    var _ = require('underscore');
    var widgets = require('./widgets');
    //var PopupForm = require('./popup-form');

    var preProcess = function (controls) {
        var paramterMap = {};
        _.each(controls, function (item) {
            item.sequence = parseInt(item.sequence);
            item.isRequired = item.isRequired === true || item.isRequired === '1';
            item.isReadonly = item.isMerge === '1';
            item.timeformat = item.isStorage;

            if (item.controlId === 'EventButton') {
                //DoNothing now
                //TODO 后续可能会修改
            }
            else if (typeof item.jsonData === 'string' && item.jsonData.length > 0) {
                item.jsonData = JSON.parse(item.jsonData);
                if (item.jsonData.toSum === false) {
                    item.compute = false;
                }
                if (item.jsonData.integer === true) {
                    item.type = 'integer';
                }
            }

            if (item.alias && item.alias.length > 0) {
                paramterMap[item.reName] = item.alias;
            }
        });
        return [controls, paramterMap];
    };

    var baseGetValue = function ($item) {
        var $input = $item.find('input[name] ,textarea[name]');
        return {
            controlName: $item.data('widget'),
            id: $input.attr('name'),
            value: $input.val()
        };
    };
    var nullGetValue = function () { return null; };
    var valueGetter = {
        'TextField': baseGetValue,
        'TextareaField': baseGetValue,
        'NumberField': baseGetValue,
        'DDSelectField': baseGetValue,
        'DDMultiSelectField': baseGetValue,
        'DDDateField': baseGetValue,
        'DDDateRangeField': function ($item) {
            var $startInput = $item.find('.range-start'),
                $endInput = $item.find('.range-end');
            return {
                controlName: $item.data('widget'),
                id: $startInput.attr('name'),
                value: [$startInput.val(), $endInput.val()]
            };
        },
        'DDPhotoField': baseGetValue,
        'TableField': function ($item, widgets) {
            var thisGetter = this;
            var listCollection = [], sumList = [];

            var id = $item.find('.table-container').data('name');
            var tableFieldView = widgets[id];

            var boxes = $item.find('.table-box');
            boxes.each(function (index, box) {
                var $box = $(box);
                var boxWidgets = tableFieldView.boxes[$box.data('id')].widgets;
                var boxList = [];

                $box.children().each(function (i, child) {
                    var $child = $(child);
                    if ($child.is('.form-item')) {
                        var widgetType = $child.data('widget');
                        var childValue = thisGetter[widgetType]($child, boxWidgets);
                        if (childValue) {
                            boxList.push(childValue);
                        }
                    }
                });
                listCollection.push({ list: boxList });
            });
            var sumFields = $item.find('.compute-container .numbercompute');
            sumFields.each(function (index, child) {
                sumList.push(baseGetValue($(child)));
            });

            return {
                controlName: 'TableField',
                id: id,
                value: listCollection,
                sumList: sumList
            };
        },
        'TextNote': nullGetValue,
        'MoneyField': baseGetValue,
        'DDAttachment': baseGetValue,
        'PictureNote': nullGetValue,
        'LinkageSelectField': function ($item) {
            var $parentInput =  $item.find('input.parent'),
                $childInput =  $item.find('input.child');

            return {
                controlName: $item.data('widget'),
                id: $parentInput.attr('name'),
                value: [$parentInput.val(), $childInput.val()]
            };
        },
        'ComputeField': baseGetValue,
        'ValidField': null,
        'EventButton': nullGetValue,
        'UserSelect': baseGetValue,
        'ApproveSelect': nullGetValue,
        'TabPage': function ($item, widgets) {
            var thisGetter = this;
            var $container = $item.find('.tabpage-container');

            var id = $container.data('name');
            var tabPageView = widgets[id];
            var tabPageWidgets = tabPageView.widgets;

            var valueList = [];
            $container.children().each(function (i, child) {
                var $child = $(child);
                if ($child.is('.form-item')) {
                    var widgetType = $child.data('widget');
                    var childValue = thisGetter[widgetType]($child, tabPageWidgets);
                    if (childValue) {
                        valueList.push(childValue);
                    }
                }
            });

            return {
                controlName: 'TabPage',
                id: id,
                value: valueList
            };
        },
        'RTEditor': function ($item, widgets) {
            var id = $item.find('.editor-box').data('name');
            var editor = widgets[id];
            return {
                controlName: 'RTEditor',
                id: id,
                value: editor.getHtml()
            };
        },
        'DocumentView': nullGetValue
    };

    var getFilesUrls = function (type, list) {
        var arr = [];
        list.find('.' + type + '-box').each(function (index, item) {
            var $this = $(this);
            arr.push({ id: $this.data('id'), name: $this.data('name') });
        });
        return arr.length === 0 ? '' : JSON.stringify(arr);
    };
    var addFile = function (model, list) {
        var html = '<div class="attach-box" data-name="' + model.name + '" data-id="' + model.id + '">\
            <div class="attach-icon"><i class="iconfont icon-xinxi"></i></div>\
            <span class="attach-name">' + model.name + '</span>\
            <span class="box-remove">\
                <i class="iconfont icon-shibai"></i>\
            </span>\
        </div>';

        list.append($(html));
    };
    var addImage = function (model, list) {
        var html = '<div class="img-box" data-name="' + model.name + '" data-id="' + model.id + '">\
            <span class="box-remove">\
                <i class="iconfont icon-shibai"></i>\
            </span>\
            <img id="images" src="' + CONTEXT_PATH + '/file/download/' + model.id + '/thum_' + model.name + '.do' + '">\
        </div>';

        list.append($(html));
    };
    var setField = function (parent, valItem, widgets) {
        if (valItem.controlName === 'DDDateRangeField') {
            parent.find('.range-start[name=' + valItem.id + ']').val(valItem.value[0]);
            parent.find('.range-end[name=' + valItem.id + ']').val(valItem.value[1]);
        }
        else if (valItem.controlName === 'DDPhotoField' || valItem.controlName === 'DDAttachment') {
            var valInput = parent.find('[name=' + valItem.id + ']');
            valInput.val(valItem.value);
            var list = valInput.parent().find('.list');

            var models = valItem.value.length > 0 ? JSON.parse(valItem.value) : [];
            _.each(models, function (model) {
                valItem.controlName === 'DDPhotoField' ? addImage(model, list) : addFile(model, list);
            });
        }
        else if (valItem.controlName === 'UserSelect') {
            widgets[valItem.id].setEmps(JSON.parse(valItem.value));
        }
        else if (valItem.controlName === 'RTEditor') {
            widgets[valItem.id].setHtml(valItem.value);
        }
        else {
            parent.find('[name=' + valItem.id + ']').val(valItem.value);
        }
    };
    var setTableField = function (container, values) {
        var addBtn = container.parent().find('.add-button');
        _.each(values, function (item, index) {
            if (index > 0) { addBtn.click(); }
            var box = container.children().eq(index);
            _.each(item.list, function (valItem) {
                setField(box, valItem);
            });
        });
    };

    var getTableFieldParamters = function (paramMap, tableValue) {
        var paramValues = {};
        _.each(tableValue, function (item) {
            _.each(item.list, function (childitem) {
                var paramSet = paramMap[childitem.id];
                if (paramSet) {
                    if (!paramValues[paramSet.name]) {
                        paramValues[paramSet.name] = [];
                    }

                    if (paramSet.type === 'number') {
                        paramValues[paramSet.name].push(childitem.value.indexOf('.') >= 0 ? parseFloat(childitem.value) : parseInt(childitem.value));
                    }
                    else {
                        paramValues[paramSet.name].push(childitem.value);
                    }
                }
            });
        });
        return paramValues;
    };
    var getTabPageParamters = function (paramMap, pageValue) {
        var paramValues = {};
        _.each(pageValue, function (item) {
            var paramSet = paramMap[item.id];
            if (paramSet) {
                if (paramSet.type === 'number') {
                    paramValues[paramSet.name] = item.value.indexOf('.') >= 0 ? parseFloat(item.value) : parseInt(item.value);
                }
                else {
                    paramValues[paramSet.name] = item.value;
                }
            }
        });
        return paramValues;
    };

    var ApproveForm = function (elem, controls) {
        var _this = this;
        this.$el = elem;

        var controlsData = preProcess(controls);
        this.controls = controlsData[0];
        this.controls.sort(function (a,b) { return a.sequence - b.sequence; });
        this.paramterMap = controlsData[1];
        this.widgets = {};
        this.valids = [];
        this.attributes = {};

        var ctrlList = [], afterRender = [];
        _.each(this.controls, function (item) {
            if (item.sequence % 100 !== 0) { return; }
            if (!widgets.hasOwnProperty(item.controlId)) { return; }

            var children = null;
            if (item.controlId === 'TableField' || item.controlId == 'TabPage') {
                children = _.filter(_this.controls, function (child) {
                    return child.sequence % 100 !== 0 && (Math.floor(child.sequence / 100) * 100 === item.sequence);
                });
            }

            var widgetItem = widgets[item.controlId](item, children, afterRender),
                widgetEl;
            if (item.controlId === 'ValidField') {  //不显示在页面上的验证控件
                _this.valids.push(widgetItem);
            }
            else {
                if (widgetItem.jquery) { widgetEl = widgetItem; }
                else widgetEl = widgetItem.$el;
                _this.widgets[item.reName] = widgetItem;
                widgetEl.css('width', parseInt(item.field1 || '12') * 8.333333 + '%');
                ctrlList.push(widgetEl);
            }
        });

        this.$el.append(ctrlList);
        _.each(afterRender, function (item) {
            if (typeof item === 'function') {
                item(_this.$el, _this);
            }
        });
    };
    ApproveForm.prototype.checkRequired = function () {
        var _this = this;
        var success = true, message = '', tempName = '';
        this.$el.find('[required]').each(function () {
            if ($.trim($(this).val()) === '') {
                tempName = $(this).attr('name');
                success = false;
                _.each(_this.controls, function (item) {
                    if (item.reName === tempName) {
                        message = item.describeName + '为必填项！';
                        return false;
                    }
                });
                return false;
            }
        });

        var result = { success: success, message: message };
        if (result.success) {
            result =  this.checkValid();
        }
        if (result.success) {
            result =  this.checkApprover();
        }
        return result;
    };
    ApproveForm.prototype.checkApprover = function () {
        var _this = this;
        var success = true, message = '';
        if (_this.widgets['approvalIds']) {
            success = _this.widgets['approvalIds'].valid();
            if (!success) message = '请先选择审批人!';
        }
        return { success: success, message: message };
    };
    ApproveForm.prototype.checkValid = function () {
        var success = true, message = '';
        if (this.valids.length > 0) {
            for (var i = 0; i < this.valids.length; i++) {
                if (!this.valids[i].valid(this.$el)) {
                    success = false;
                    message = this.valids[i].message;
                    break;
                }
            }
        }
        return { success: success, message: message };
    };
    ApproveForm.prototype.getData = function () {
        var _this = this;
        var dataList = [];
        this.$el.children().each(function (index, item) {
            var $item = $(item);
            var widgetType = $item.data('widget');
            var valueData = valueGetter[widgetType]($item, _this.widgets);
            if (valueData) {
                dataList.push(valueData);
            }
        });

        return dataList;
    };
    ApproveForm.prototype.setData = function (data) {
        _.each(data, function (item) {
            if (item.controlName === 'TableField') {
                var container = this.$el.find('[data-name=' + item.id + ']');
                setTableField(container, item.value);

                var sumContainer = container.next();
                _.each(item.sumList, function (sumItem) {
                    setField(sumContainer, sumItem);
                });
            }
            else if (item.controlName === 'TabPage') {
                var pageContainer = this.$el.find('[data-name=' + item.id + ']');
                _.each(item.value, function (pageItem) {
                    setField(pageContainer, pageItem);
                });
            }
            else {
                setField(this.$el, item, this.widgets);
            }
        }, this);
    };
    ApproveForm.prototype.setDataByParamters = function (paramters, paramMap) {
        var data = [];
        var turnMap = {};
        _.each(paramters, function (item, key) {
            var widget = paramMap[key];
            if (!widget) { return; }
            data.push({
                id: widget.controlID,
                controlName: widget.controlID.replace(/\d/g, ''),
                value: item.value,
                readonly: item.readonly
            });
        });
        this.setData(data);

        _.each(data, function (item) {
            if (!item.readonly) { return; }
            var widgetEl = this.$el.find('[name=' + item.id + ']');
            var cloneEl = widgetEl.clone(false, false);
            cloneEl.val(widgetEl.val()).prop('readonly', true);
            widgetEl.replaceWith(cloneEl);

            //var takeHtml = widgetEl.html();
            //widgetEl.html(takeHtml);
            //widgetEl.find('input, textarea').prop('readonly', true);
        }, this);
    };
    ApproveForm.prototype.getParamters = function (paramMap, data) {
        var data = data || this.getData();
        var turnMap = {}, paramValues = {};
        _.each(paramMap, function (item, key) {
            turnMap[item.controlID] = item;
        });

        _.each(data, function (item, i) {
            if (item.controlName === 'TableField') {
                var tableParamValues = getTableFieldParamters(turnMap, item.value);
                paramValues = _.extend(paramValues, tableParamValues);
            }
            else if (item.controlName === 'TabPage') {
                var tabPageParamValues = getTabPageParamters(turnMap, item.value);
                paramValues = _.extend(paramValues, tabPageParamValues);
            }
            else {
                var paramSet = turnMap[item.id];
                if (paramSet) {
                    if (paramSet.type === 'number') {
                        paramValues[paramSet.name] = item.value.indexOf('.') >= 0 ? parseFloat(item.value) : parseInt(item.value);
                    }
                    else {
                        paramValues[paramSet.name] = item.value;
                    }
                }
            }
        });

        return paramValues;
    };
    ApproveForm.prototype.setId = function (id) {
        this._id = id;
    };
    ApproveForm.prototype.getId = function (id) {
        return this._id;
    };
    ApproveForm.prototype.setAttribute = function (key, val) {
        this.attributes[key] = val;
    };
    ApproveForm.prototype.getAttribute = function (key) {
        return this.attributes[key];
    };
    ApproveForm.prototype.eventTrigger = function (eventName, eventParam) {
        var taskId = this.getAttribute('taskId');
        require.async('./popup-form', function (PopupForm) {
            new PopupForm({
                eventName: eventName,
                taskId: taskId,
                eventParam: eventParam
            });
        });
    };

    var initForm = function (formElem, controls) {
        return new ApproveForm(formElem, controls);
    };

    module.exports = initForm;
});
