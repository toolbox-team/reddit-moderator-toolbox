function modmatrix() {
var self = new TB.Module('Mod Log Matrix');
self.shortname = 'ModMatrix'; // backwards compatibility

////Default settings
self.settings['enabled']['default'] = true;
self.settings['betamode'] = false;

self.version = 2.0;
self.limit = 300;
self.after = null;
self.subredditUrl = null;
self.subredditName = null;

self.firstEntry = null;
self.lastEntry = null;

self.subredditModerators = null;
self.subredditActions = null;
self.total = 0;

self.isMulti = false;

// These need moved into TB.ui.
self.downSortingIcon = "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAQklEQVQoU2NkoAAwUqCXYVQziaGHLcD+4zEDRT2u0MZmAIZafFGFbABWdYTiGWQATjWENOMNQoo1M5EYQ3DlFNkMAOsiBBL3uxzDAAAAAElFTkSuQmCC";
self.upSortingIcon = "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAQ0lEQVQoU2NkoAAwUqCXAaSZiVwDKLaZXIvBzsYH/gMlcarBpxmkEQawqsOlGVkjTgOwacamEasBhPyMN0BGNZOY1gDYfgQSUTVBXwAAAABJRU5ErkJggg==";

self.run = function () {
    this.addButton();

    var subredditUrl = this.getSubredditUrl();
    if (subredditUrl.charAt(subredditUrl.length - 1) != "/")
        subredditUrl += "/";
    this.subredditUrl = subredditUrl;

    var regex = new RegExp(/reddit\.com\/r\/([^\/]+)\//g);
    var matches = regex.exec(subredditUrl);

    this.isMulti = false;

    if (matches == null) {

        regex = new RegExp(/reddit\.com\/user\/[^\/]+\/m\/([^\/]+)\//g);
        matches = regex.exec(subredditUrl);

        if (matches == null) {
            return false;
        }

        this.isMulti = true;
    }
    this.subredditName = matches[1];

    if (location.hash != null && location.hash == "#matrix")
        self.renderMatrix();
};

self.addButton = function () {

    // The reason for the <span> is in case the user has both report matrix AND report gen: http://i.imgur.com/Izbm6Rh.png,
    // the reason the &nbsp; is before and after is becase we don't know which script will load first.  Not a great solution, but it works.
    $('.menuarea').append('\
<div class="spacer">\
<span style="float:right;">&nbsp;<a class="reddit-moderationlog" href="#matrix" >toggle moderation log matrix</a>&nbsp;</span>\
</div>\
');

    $('.reddit-moderationlog').click(function (e) {
        e.preventDefault();
        self.renderMatrix();
        return false;
    });
};

self.currentSorting = {
    index: null,
    direction: 1
};

self.sort = function (index, direction) {
    var rows = $("#mod-matrix tbody tr");

    direction = direction != null ? direction : (index == this.currentSorting.index ? this.currentSorting.direction * -1 : index === 0 ? -1 : 1);

    var newArray = [];

    rows.each(function () {
        newArray.push(this);
    });

    function tdValue(td) {
        if (index === 0)
            return $.text(td).toLowerCase();
        else
            return parseInt($.text(td));
    }

    newArray.sort(function (a, b) {
        var aValue = tdValue($(a).find("td").get(index));
        var bValue = tdValue($(b).find("td").get(index));

        if (aValue == bValue)
            return 0;
        else
            return aValue > bValue ? direction * -1 : direction;
    });

    this.currentSorting = {index: index, direction: direction};
    $("#mod-matrix tbody").html("").append($(newArray));

    var header = $("#mod-matrix thead");
    header.find(".sorting-icon").remove();
    $(header.find("th").get(index)).append('<img src="data:image/png;base64,' + (direction == -1 ? self.upSortingIcon : self.downSortingIcon) + '" alt="" class="sorting-icon" />');
};

self.renderMatrix = function () {
	var self = this;
    var siteTable = $("#siteTable");

    $(".drop-choices.lightdrop a").each(function () {
        $(this).attr("href", $(this).attr("href") + "#matrix");
    });

    this.resetData();

    var previousContent = siteTable.children();
    // Hide next/prev (if RES, not an issue).
    previousContent = previousContent.add(".content > .nextprev");
    previousContent.hide();

    var wrapper = $("<div></div>").attr("id", "mod-matrix-wrapper");
    siteTable.append(wrapper);

    // Create table
    var matrix = $("<table></table>").addClass("generic-table mod-matrix").attr("id", "mod-matrix");

    var header = $("<tr></tr>").wrap("<thead></thead>");
    header.append("<th></th>");
    var footer = $("<tr class=\"totals\"></tr>").wrap("<tfoot></tfoot>");
    footer.append("<td>Total</td>");

    for (var subredditAction in this.subredditActions) {
        header.append("<th class=\"action-cell action-" + subredditAction + "\"><a class=\"modactions " + subredditAction + "\" title=\"" + this.subredditActions[subredditAction].title + "\"></a></th>");
        footer.append("<td class=\"action-cell action-" + subredditAction + "\"><a target=\"_blank\" title=\"Total " + this.subredditActions[subredditAction].title + "\" href=\"" + this.subredditUrl + "about/log?type=" + subredditAction + "\" class=\"action-number\">0</span></td>");
    }
    header.append("<th>Total</th>");
    header.append("<th class=\"action-percentage\">%</th>");
    footer.append("<td class=\"action-total\"><span class=\"action-number\">0</span></td>");
    footer.append("<td class=\"action-percentage\"></td>");

    var body = $("<tbody></tbody>");

    header.parent().appendTo(matrix);
    footer.parent().appendTo(matrix);
    body.appendTo(matrix);
    wrapper.append(matrix);

    wrapper.append('<div id="mod-matrix-statistics"></div>');

    wrapper.append('<div id="mod-matrix-settings"><form action="" method="GET">\
<table><tr><td>between:</td><td><input type="date" name="from" /> and <input type="date" name="to" /></td></table>\
</form></div>');

    var modMatrixSettings = $("#mod-matrix-settings");

    $('.reddit-moderationlog').unbind('click').click(function () {
        self.getActions();
    });

    header.find("th").click(function () {
        self.sort($(this).index());
    });

    modMatrixSettings.find("form").bind("submit", function (e) {
        e.preventDefault();
        self.submitForm(this);

        return false;
    });

    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    var toDate = new Date();
    var minDate = new Date();
    minDate.setDate(toDate.getDate() - 90);

    modMatrixSettings.find("input[name=from]").val(fromDate.toJSON().slice(0, 10));
    //modMatrixSettings.find("input[name=from],#mod-matrix-settings input[name=to]").attr("min", minDate.toJSON().slice(0,10));
    modMatrixSettings.find("input[name=to]").val(toDate.toJSON().slice(0, 10));
    modMatrixSettings.find("input[name=from],#mod-matrix-settings input[name=to]").attr("max", toDate.toJSON().slice(0, 10));

    // Moderator filter
    var modFilterRow = $("<tr><td>moderators:</td></tr>");
    var modFilterCell = $("<div></div>").wrap("<td></td>").hide().attr("id", "modfilter");
    modFilterCell.append('<div><input type="checkbox" value="" id="modmatrixmodfilter-all" checked="checked" /><label for="modmatrixmodfilter-all">All</label></div>');
    for (var moderator in this.subredditModerators) {
        modFilterCell.append('<div style="padding-left: 10px;"><input class=\"mod-filter\" type="checkbox" value="' + moderator + '" id="modmatrixmodfilter-' + moderator + '" /><label for="modmatrixmodfilter-' + moderator + '">' + moderator + '</label></div>');
    }
    modMatrixSettings.find("table").append(modFilterRow);
    var addButton = $("<a></a>").text("show moderator filter").insertBefore(modFilterCell);
    modFilterCell.parent().appendTo(modFilterRow);
    $("#modmatrixmodfilter-all").change(function () {
        if (this.checked) {
            $("#mod-matrix-settings .mod-filter").prop("checked", "checked");
        } else {
            $("#mod-matrix-settings .mod-filter").removeAttr("checked");
        }
    });
    modFilterCell.find(".mod-filter").change(function () {
        if ($("#mod-matrix-settings .mod-filter:not(:checked)").length > 0) {
            $("#modmatrixmodfilter-all").removeAttr("checked");
        } else {
            $("#modmatrixmodfilter-all").prop("checked", "checked");
        }
    });
    addButton.click(function () {
        if (modFilterCell.is(":hidden")) {
            modFilterCell.show();
            $(this).text("hide moderator filter");
        } else {
            modFilterCell.hide();
            $(this).text("show moderator filter");
        }
    });

    // Unless we're on /r/mod or a /m/ulti, we want to check the mod filters for _active_ mods. These do not include shadow banned and deleted users
    if (this.subredditName != "mod" && !this.isMulti) {
        var subredditNames = this.subredditName.split("+");
        var self = this;

        for (var i = 0; i < subredditNames.length; i++) {
            $.getJSON("/r/" + subredditNames[i] + "/about/moderators.json", function (moderatorData) {
                for (var j = 0; j < moderatorData.data.children.length; j++) {
                    $("#modmatrixmodfilter-" + moderatorData.data.children[j].name).prop("checked", "checked");
                }
                if ($("#mod-matrix-settings .mod-filter:not(:checked)").length > 0) {
                    $("#modmatrixmodfilter-all").removeAttr("checked");
                } else {
                    $("#modmatrixmodfilter-all").prop("checked", "checked");
                }
            });
        }
    }

    // Action filter
    var actionFilterRow = $("<tr><td>actions:</td></tr>");
    var actionFilterCell = $("<div></div>").wrap("<td></td>").hide();
    actionFilterCell.append('<div><input type="checkbox" value="" id="modmatrixactionfilter-all" checked="checked" /><label for="modmatrixactionfilter-all">All</label></div>');
    // I want these sorted alphabetically
    var actions = $.map(this.subredditActions, function (value, index) {
        return value;
    });
    actions.sort(function (a, b) {
        if (a.title == b.title) {
            return 0;
        } else if (a.title < b.title) {
            return -1;
        } else {
            return 1;
        }
    });
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        actionFilterCell.append('<div style="padding-left: 10px;"><input class=\"action-filter\" type="checkbox" value="' + action.className + '" id="modmatrixactionfilter-' + action.className + '" checked="checked" /><label for="modmatrixmodfilter-' + action.className + '">' + action.title + '</label></div>');
    }
    modMatrixSettings.find("table").append(actionFilterRow);
    var addButton = $("<a></a>").text("show action filter").insertBefore(actionFilterCell);
    actionFilterCell.parent().appendTo(actionFilterRow);
    $("#modmatrixactionfilter-all").change(function () {
        if (this.checked) {
            $("#mod-matrix-settings .action-filter").prop("checked", "checked");
        } else {
            $("#mod-matrix-settings .action-filter").removeAttr("checked");
        }
    });
    actionFilterCell.find(".action-filter").change(function () {
        if ($("#mod-matrix-settings .action-filter:not(:checked)").length > 0) {
            $("#modmatrixactionfilter-all").removeAttr("checked");
        } else {
            $("#modmatrixactionfilter-all").prop("checked", "checked");
        }
    });
    addButton.click(function () {
        if (actionFilterCell.is(":hidden")) {
            actionFilterCell.show();
            $(this).text("hide action filter");
        } else {
            actionFilterCell.hide();
            $(this).text("show action filter");
        }
    });

    // Automatic refresh the table when action filter is changed. Same thing with mod filter, as long as there are fewer than 20 mods
    modMatrixSettings.find(".action-filter" + (modMatrixSettings.find(".mod-filter").length < 20 ? ", .mod-filter" : "")).change(function () {
        self.refreshTable();
    });

    // Show labels
    modMatrixSettings.find("table").append('<tr><td><label for="showlabels">show header labels:</label></td><td><input id="showlabels" type="checkbox" /></td></tr>');
    $("#showlabels").change(function () {
        $("#mod-matrix").toggleClass("labels", this.checked);
    });

    // Show percentages
    modMatrixSettings.find("table").append('<tr><td><label for="showpercentages">show percentages:</label></td><td><input id="showpercentages" type="checkbox" checked="checked" /></td></tr>');
    $("#showpercentages").change(function () {
        $("#mod-matrix .action-percentage").toggle(this.checked);
        $("#highlightpercentages").parent().parent().toggle(this.checked);
    });

    // Highlight percentages
    modMatrixSettings.find("table").append('<tr><td><label for="highlightpercentages">highlight percentages below:</label></td><td><input id="highlightpercentages" type="number" value="0" min="0" max="100" /></td></tr>');
    $("#highlightpercentages").change(function () {
        self.highlightPercentages()
    });

    $("#mod-matrix-settings form").append('<input type="submit" value="generate" />');

    for (var moderator in this.subredditModerators) {
        this.createModeratorRow(moderator);
    }

    $('.reddit-moderationlog').unbind('click').click(function (e) {
        e.preventDefault();
        if (wrapper.is(":hidden")) {
            wrapper.show();
            previousContent.hide();
            location.hash = "matrix";
        } else {
            previousContent.show();
            wrapper.hide();
            location.hash = "";
        }
        return false;
    });

    // Load data
    //this.getActions();
};

self.highlightPercentages = function () {
    var matrix = $("#mod-matrix");
    var threshold = parseInt($("#highlightpercentages").val());
    $("#mod-matrix tr").removeClass("highlight");
    if (threshold == 0)
        return;
    $("#mod-matrix td.action-percentage .action-number").each(function () {
        if (parseInt($(this).text()) < threshold)
            $(this).parents("tr:first").addClass("highlight");
    });
};

self.submitForm = function (form) {
    self.resetData();

    var from = $(form).find("input[name=from]").val();
    var to = $(form).find("input[name=to]").val();

    var fromDate = new Date(from);
    var fromUTC = this.dateToUTC(new Date(from));
    var toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    var toUTC = this.dateToUTC(toDate);

    self.maxDate = toUTC.getTime();
    self.minDate = fromUTC.getTime();

    this.getRecursiveActions(null, null);
};

self.resetData = function () {
    self.after = null;
    self.firstEntry = null;
    self.lastEntry = null;
    self.subredditActions = this.getSubredditActions();
    self.subredditModerators = this.getSubredditModerators();
    self.modFilter = [];
    self.actionFilter = [];
    self.total = 0;
    self.iterations = 0;
    $("#mod-matrix .action-number").text("0");
};

self.getRecursiveActions = function (data, hasMoreData) {
    self.iterations += 1;
    if (hasMoreData == null || hasMoreData == true) {
        self.getActions(self.getRecursiveActions);
    } else {
        self.refreshTable();
    }
};

self.createModeratorRow = function (moderator) {
    var body = $("#mod-matrix tbody");
    if (body.find("tr.moderator-" + moderator).length > 0)
        return;
    var row = $("<tr></tr>").addClass("moderator-" + moderator).addClass("mod-row");

    row.append("<td><a href=\"/user/" + moderator + "\" target=\"_blank\" title=\"" + moderator + "\">" + moderator + "</a></td>");
    for (var subredditAction in this.subredditActions) {
        var td = $("<td class=\"action-cell action-" + subredditAction + "\"><a title=\"" + this.subredditActions[subredditAction].title + " actions by " + moderator + "\" target=\"_blank\" class=\"action-number\" href=\"" + this.subredditUrl + "about/log?type=" + subredditAction + "&mod=" + moderator + "\">0</a></td>");
        row.append(td);
    }
    row.append("<td class=\"action-total\"><a class=\"action-number\" target=\"_blank\" title=\"total actions by " + moderator + "\"  href=\"" + this.subredditUrl + "about/log?mod=" + moderator + "\">0</a></td>");
    row.append("<td class=\"action-percentage\"><span class=\"action-number\" title=\"percentage of actions by " + moderator + "\">0</span><span>%</span></td>");

    body.append(row);
};

self.dataCache = [];

self.clearCache = function () {
    self.dataCache = [];
};

self.getActions = function (callback) {
    var requestData = {
        limit: this.limit,
        count: (this.iterations - 1) * this.limit
    };

    if (this.after != null) requestData.after = this.after;

    TBUtils.log.push("Retreiving " + requestData.count + " to " + (requestData.count + requestData.limit));
    $("#mod-matrix-statistics").text("loading entries " + requestData.count + " to " + (requestData.count + requestData.limit) + "...");
    $("#mod-matrix-settings input[type=submit]").attr("disabled", "disabled");

    var url = this.subredditUrl + "about/log.json";
    var cacheKey = url + "?" + JSON.stringify(requestData);

    if (this.dataCache[cacheKey] != null) {
        self.processData(this.dataCache[cacheKey], callback);
    } else {
        $.getJSON(url, requestData, function (response) {
            TBUtils.log.push("Got " + requestData.count + " to " + (requestData.count + requestData.limit));
            var data = response.data;
            self.processData(data, callback);
            self.dataCache[cacheKey] = data;
        })
            .fail(function (jqxhr, textStatus, error) {
                TBUtils.log.push("Mod log request " + requestData.count + "to " + (requestData.count + requestData.limit) + " failed (" + jqxhr.status + "), " + textStatus + ": " + error);
                if (jqxhr.status == 504) {
                    TBUtils.log.push("Retrying mod log request...");
                    self.getActions(callback);
                }
                else {
                    //End and display what we have with an error
                    self.processData(null, callback);
                }
            })
    }
};

self.updateFilters = function () {
    self.modFilter = [];
    if (!$("#modmatrixmodfilter-all").is(":checked")) {
        var modFilters = $("#mod-matrix-settings .mod-filter:checked");

        modFilters.each(function () {
            if ($(this).val() != "") {
                self.modFilter.push($(this).val());
            }
        });
    }
    self.actionFilter = [];
    if (!$("#modmatrixactionfilter-all").is(":checked")) {
        var actionFilters = $("#mod-matrix-settings .action-filter:checked");

        actionFilters.each(function () {
            if ($(this).val() != "") {
                self.actionFilter.push($(this).val());
            }
        });
    }
};

self.refreshTable = function () {
    this.updateFilters();
    var hasModFilter = self.modFilter != null && !$.isEmptyObject(self.modFilter),
        hasActionFilter = self.actionFilter != null && !$.isEmptyObject(self.actionFilter);
    var actionTotals = {};
    var matrix = $("#mod-matrix");

    //modLogMatrix.filterModeratorActions();

    // Mod numbers
    for (var mod in this.subredditModerators) {
        var moderator = self.subredditModerators[mod];
        var modRow = matrix.find(".moderator-" + mod + "");
        var total = 0;
        for (var action in moderator) {
            var value = parseInt(moderator[action]);
            var cell = modRow.find(".action-" + action + " .action-number").text(value);
            total += value;
        }
        modRow.toggleClass("filtered", hasModFilter && $.inArray(mod, self.modFilter) == -1);
        //matrix.find(".moderator-" + mod + " .action-total").text(total);
    }
    //modLogMatrix.filterModeratorActions();

    // Action totals
    for (var action in this.subredditActions) {
        //var total = actionTotals[action] || 0;
        matrix.find(".action-" + action + "").toggleClass("filtered", hasActionFilter && $.inArray(action, self.actionFilter) == -1);
        var total = 0;
        matrix.find("tbody .action-" + action + " .action-number:visible").each(function () {
            total += parseInt($(this).text());
        });

        matrix.find("tfoot .action-" + action + " .action-number").text(total);
    }


    //modLogMatrix.filterColumnActions();
    //modLogMatrix.highlightPercentages();

    matrix.find("tfoot tr, tbody tr").each(function () {
        var rowTotal = 0;
        $(this).find(".action-cell .action-number:visible").each(function () {
            rowTotal += parseInt($(this).text());
        });
        $(this).find(".action-total .action-number").text(rowTotal);
    });

    var allTotal = parseInt(matrix.find("tr.totals .action-total .action-number").text());
    if (allTotal > 0) {
        matrix.find("tbody tr").each(function () {
            var total = parseInt($(this).find(".action-total .action-number").text());
            var percentage = parseInt((total / allTotal) * 100);
            $(this).find(".action-percentage .action-number").text(percentage);
        });
    } else {
        matrix.find(".action-percentage .action-number").text("0");
    }

    this.highlightPercentages();
    // Re-sort table
    if (this.currentSorting.index != null) {
        this.sort(this.currentSorting.index, this.currentSorting.direction);
    }
};

self.processData = function (data, callback) {
    var hasModFilter = self.modFilter != null && !$.isEmptyObject(self.modFilter),
        hasActionFilter = self.actionFilter != null && !$.isEmptyObject(self.actionFilter);
    var matrix = $("#mod-matrix");
    var finished = data == null,
        errored = finished;

    if (!finished) {
        for (var i = 0; i < data.children.length; i++) {
            var item = data.children[i].data;

            var action = item.action;
            var mod = item.mod;
            var moderator = self.subredditModerators[mod];

            if (self.minDate != null && self.minDate > item.created_utc * 1000) {
                //console.log("Item older than fromDate", item.created_utc, modLogMatrix.minDate);
                finished = true;
                break;
            } else if (
                (self.maxDate != null && self.maxDate < item.created_utc * 1000)
            // (hasModFilter && $.inArray(mod, modLogMatrix.modFilter) == -1) ||
            // (hasActionFilter && $.inArray(action, modLogMatrix.actionFilter)  == -1)
            ) {
                //console.log("Item newer than toDate", item.created_utc, modLogMatrix.maxDate);
                continue;
            }

            if (self.firstEntry == null) {
                self.firstEntry = item;
                if (i != 0 || self.after != null) {
                    self.beforeFirst = data.children[i - 1].data;
                }
            }

            if (moderator == null) {
                moderator = {total: 0};
                self.subredditModerators[mod] = moderator;
                self.createModeratorRow(mod);
            }

            var actionCount = moderator[action] ? moderator[action] + 1 : 1;

            moderator[action] = actionCount;

            //modLogMatrix.subredditActions[action].total += 1;
            self.total += 1;
            self.lastEntry = item;

            //Update html
            // matrix.find(".moderator-" + mod + " .action-" + action + "").text(moderator[action]);
            // matrix.find(".moderator-" + mod + " .action-total").text(moderator.total);
            // matrix.find(".totals .action-" + action + "").text(modLogMatrix.subredditActions[action].total);
            // matrix.find(".totals .action-total").text(modLogMatrix.total);
        }

        var lastEntry = data.children[data.children.length - 1].data;

        // Are we finished, or should we keep going?
        if (data.after == self.after || data.after == null || finished == true) {
            finished = true;
        } else {
            self.after = data.after;
        }
    }

    // Show statistics
    if (finished && self.firstEntry != null && self.lastEntry != null) {
        var lastEntryDate = new Date(self.lastEntry.created_utc * 1000);
        var firstEntryDate = new Date(self.firstEntry.created_utc * 1000);
        $("#mod-matrix-statistics").html("showing <strong>" + self.total + " actions</strong> between <strong title=\"" + lastEntryDate + "\">" + lastEntryDate.toDateString().toLowerCase() + "</strong> and <strong title=\"" + firstEntryDate + "\">" + firstEntryDate.toDateString().toLowerCase() + "</strong> " + (errored ? "(<span style='color:red'>error occured</span>)" : "") + " | <a id=\"exporttocsv\">export table to CSV</a>");
        $("#exporttocsv").click(self.exportToCSV).attr({
            "download": self.subredditName + "-modlog.csv",
            target: "_blank"
        });
    } else {
        $("#mod-matrix-statistics").html("no actions during requested period");
    }
    $("#mod-matrix-settings input[type=submit]").removeAttr("disabled");

    // Invoke callback
    if (callback != null) {
        callback(data, !finished);
    }
};

self.exportToCSV = function () {
    var table = $("#mod-matrix");

    var header = "";
    table.find("thead th").each(function () {
        if ($(this).find("a").length > 0)
            header += $(this).find("a").attr("title");
        else
            header += $(this).text();
        header += ",";
    });

    var body = "";
    table.find("tbody tr").each(function () {

        var row = "";
        $(this).find("td").each(function () {
            row += $(this).text() + ",";
        });
        if (row.charAt(row.length - 1) == ",")
            row = row.substring(0, row.length - 1);
        body += "\r\n" + row;
    });

    var footer = "\r\n";
    table.find("tfoot td").each(function () {
        footer += $(this).text() + ",";
    });
    var string = header + body + footer;
    this.href = 'data:text/csv;charset=utf-8,' + escape(string || 'sep=, \r\n');
};

self.getSubredditUrl = function () {
    return $("#header .hover.pagename.redditname a").attr("href");
};

self.getSubredditModerators = function () {
    var modItems = $(".drop-choices.lightdrop:not(.modaction-drop) a");

    modItems = $.makeArray(modItems);


    modItems.sort(function (a, b) {
        var aText = $(a).text().toLowerCase(),
            bText = $(b).text().toLowerCase();
        if (aText == bText)
            return 0;
        else
            return aText > bText ? 1 : -1;
    });

    var moderators = {};

    $(modItems).each(function () {
        var mod = $(this).text();
        if (mod == "all" || mod == "admins*")
            return;

        moderators[$(this).text()] = {};
    });

    return moderators;
};

self.getSubredditActions = function () {
    var actionItems = $(".drop-choices.lightdrop.modaction-drop a");

    var actions = {};

    actionItems.each(function () {
        if ($(this).text() == "all")
            return;

        var actionLink = $(this).attr("href");
        var actionCode = self.getQuerystringByName("type", actionLink);
        actions[actionCode] = {"title": $(this).text(), "className": actionCode};
    });

    return actions;
};

self.getQuerystringByName = function (name, url) {
    if (url == null)
        url = location.search;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};

self.dateToUTC = function (date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
};


self.init = function () {
    if (!TBUtils.isModLogPage) return;

    self.log('Running Mod Matrix Module');
    self.run();

    var $body = $('body');

    var commentLoadActive = false,
        ratelimitRemaining = 200,
        ratelimitReset;
    $('.content .menuarea').append('<div class="spacer"><span id="ratelimit-counter"></span><span style="float:right;">&nbsp;<a href="javascript:;" class="activate-comment-load" >Load text of removed comments.</a>  &nbsp; &nbsp;</span></div>');


    function getComments() {
        $('.modactionlisting table tr.modactions').each(function () {
            var $this = $(this);
            if ($this.find('.button a').hasClass("removecomment")) {
                var removedUrl = $this.find('.description a').attr('href');
                var commentID = removedUrl.match(/.*reddit\.com\/r\/.*\/(.*?)$/);
                commentID = commentID[1];
                removedUrl = removedUrl + '.json';


                if (!$this.find('.description').attr('id')) {
                    $this.find('.description').attr('id', commentID);

                    $.getJSON(removedUrl).done(function (data, status, jqxhr) {

                        $body.find('.activate-comment-load').attr('data-remaining', ratelimitRemaining);
                        $body.find('.activate-comment-load').attr('data-reset', ratelimitReset);

                        var approved = data[1].data.children[0].data.approved_by;
                        var commentBody = data[1].data.children[0].data.body_html;
                        var commentID = data[1].data.children[0].data.id;

                        if (approved !== null) {
                            approved = '<br><b>Already approved by ' + approved + '</b>';
                        } else {
                            approved = '';
                        }

                        $('#' + commentID).append('<div class="removed_comment_text">' + TBUtils.htmlDecode(commentBody) + approved + '</div>');
                    });

                }
            }
        });
        TB.ui.longLoadSpinner(false);
    }


    function getRatelimit() {
        $.getJSON('/r/toolbox.json?limit=1').done(function (data, status, jqxhr) {
            var ratelimitRemaining = jqxhr.getResponseHeader('x-ratelimit-remaining');
            var ratelimitReset = jqxhr.getResponseHeader('x-ratelimit-reset');
            addComments(ratelimitRemaining, ratelimitReset);
        });

    }

    function addComments(ratelimit, ratelimitReset) {
        commentLoadActive = true;
        var commentCount = 0;
        if (ratelimit === undefined) {
            getRatelimit();
        } else {
            TB.ui.longLoadSpinner(true);
            $('.modactionlisting table tr.modactions').each(function () {
                var $this = $(this);
                if ($this.find('.button a').hasClass("removecomment")) {
                    var removedUrl = $this.find('.description a').attr('href');
                    var commentID = removedUrl.match(/.*reddit\.com\/r\/.*\/(.*?)$/);
                    commentID = commentID[1];
                    if (!$this.find('.description').attr('id')) {
                        commentCount = commentCount + 1;
                    }
                    self.log('commentcount: ' + commentCount + ' ratelimit: ' + ratelimit);
                    // lets add a little buffer just to be sure
                }
            });

            commentCount = commentCount + 10;
            if (parseInt(ratelimit) < commentCount) {
                $body.find('#ratelimit-counter').show();
                var count = parseInt(ratelimitReset);
                var counter = setInterval(timer, 1000);

                function timer() {
                    count = count - 1;
                    if (count <= 0) {
                        clearInterval(counter);
                        $body.find('#ratelimit-counter').empty();
                        $body.find('#ratelimit-counter').hide();
                        getComments();
                        return;
                    }

                    var minutes = Math.floor(count / 60);
                    var seconds = count - minutes * 60;

                    $body.find('#ratelimit-counter').html('<b>Oh dear, it seems we have hit a limit, waiting for ' + minutes + ' minutes and ' + seconds + ' seconds </b>\
            <br><br>\
            <span class="rate-limit-explain"><b>tl;dr</b> <br> Reddit\'s current ratelimit allows for <i>' + ratelimit + ' requests</i>. We are currently trying to load <i>' + parseInt(commentCount - 10) + ' comments</i>. Together with toolbox requests in the background that is cutting it a little bit too close. Luckily for us reddit tells us when the ratelimit will be reset, that is the timer you see now.</span>\
            ');
                }

            } else {
                getComments();
            }
        }

    }

    $body.on('click', '.activate-comment-load', function () {
        addComments();
    });

    // NER support.
    window.addEventListener("TBNewThings", function () {
        if (commentLoadActive) {
            addComments();
        }
    });
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        modmatrix();
    });
})();
