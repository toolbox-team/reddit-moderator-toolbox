function achievements() {
    var self = new TB.Module('Achievements');
    self.shortname = 'Achievements';

    // Default settings
    self.settings['enabled']['default'] = true;
    
    self.register_setting('save', {
        'type': 'achievement_save',
        'default': ''
    });
    
    self.register_setting('last_seen', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    
    // Saves
    function Manager() {
        var saves = [],
            saveIndex = 0,

            achievements = [];
        
        this.init = function() {
            var save = self.setting('save');
            if(save.length > 0) {
                saves = this.decodeSave(save);
            }
        };
        
        this.register = function(title, description, achievement) {
            this.registerTarget(title, description, 1, achievement);
        };
        
        this.registerTarget = function(title, description, target, achievement) {
            this.registerSeries([title], description, [target], achievement);
        };
        
        this.registerSeries = function(titles, description, maxValues, achievement) {
            if (saveIndex >= saves.length) {
                saves.push(0);
            }
            
            var achievementsBlock = [];
            for(var i = 0; i < maxValues.length; i++) {
                var title = titles[i],
                    maxValue = maxValues[i];
                
                self.log("Registering Achievement");
                if (TB.utils.devMode) self.log("  name=" + title); // spoilers
                self.log("  maxValue=" + maxValue);
                self.log("  saveIndex=" + saveIndex);

                achievementsBlock.push({
                    title: title,
                    descr: description.format(maxValue),
                    maxValue: maxValue,
                    saveIndex: saveIndex
                });
            }
            achievements.push(achievementsBlock);
            
            achievement(saveIndex);
            saveIndex++;
        };
        
        this.unlock = function(saveIndex, value) {
            if(value === undefined) {
                value = 1;
            }
            self.log("Unlocking achievement block: index="+saveIndex+", value="+value);
            
            var old = saves[saveIndex];
            self.log("  Old value: "+saves[saveIndex]);
            saves[saveIndex] += value;
            self.log("  New value: "+saves[saveIndex]);

            var achievementsBlock = achievements[saveIndex];
            for(var index = 0; index < achievementsBlock.length; index++) {
                self.log("  Checking achievement "+index);
                var achievement = achievementsBlock[index];
                self.log("    Comparing to max value: " + achievement.maxValue);
                if (saves[saveIndex] >= achievement.maxValue && old < achievement.maxValue) {
                    self.log("    Unlocked!");
                    TBUtils.notification("Mod achievement unlocked!", achievement.title, window.location + "#?tbsettings=" + self.shortname);
                }
            }
            
            if(saves[saveIndex] > achievement.maxValue) {
                saves[saveIndex] = achievement.maxValue
            }
            this.save();
        };
        
        this.save = function() {
            var save = '';
            saves.forEach(function(saveValue, saveIndex) {
                save += saveValue;
                if(saveIndex < saves.length-1) {
                    save += ";";
                }
            });
            save = btoa(save);
            self.setting('save', save);
        };
        
        // Utilities
        
        this.decodeSave = function(save) {
            var vals = atob(self.setting('save')).split(";");
            // Because "2" + 1 = 21
            if(vals && vals.length > 0) {
                for(var i = 0; i < vals.length; i++) {
                    vals[i] = parseInt(vals[i]);
                }
            }
            return vals;
        };

        this.getAchievementBlockCount = function() {
            return achievements.length;
        };
        
        this.getAchievementCount = function(saveIndex) {
            return achievements[saveIndex].length;
        };
        
        this.getAchievementTotal = function() {
            var total = 0;
            for(var saveIndex = 0; saveIndex < achievements.length; saveIndex++) {
                total += this.getAchievementCount(saveIndex);
            }
            return total;
        };

        this.getUnlockedCount = function() {
            var count = 0;
            for(var saveIndex = 0; saveIndex < achievements.length; saveIndex++) {
                var achievementsBlock = achievements[saveIndex];
                for(var index = 0; index < achievementsBlock.length; index++) {
                    if (this.isUnlocked(saveIndex, index, saves)) {
                        count++;
                    }
                }
            }
            return count;
        };
        
        this.getAchievement = function(saveIndex, index) {
            return achievements[saveIndex][index];
        };
        
        this.isUnlocked = function(saveIndex, index, saves) {
            var a = this.getAchievement(saveIndex, index);
            if(!(saves instanceof Array) || a.saveIndex >= saves.length) {
                return false;
            }
            
            return saves[a.saveIndex] >= a.maxValue;
        };
    }
    
    // Init module
    self.init = function() {
        var $body = $('body');
        self.manager = new Manager();
        self.manager.init();
        
        // Individual achievement stuff
        var lastSeen = self.setting('last_seen');
        if(lastSeen == 0) {
            lastSeen = TBUtils.getTime();
        }

        // Achievement definitions
        self.log("Registering achievements");

        // approving stuff
        self.manager.registerSeries(["too nice", "way too nice", "big softie"], "Approved {0} things", [50, 200, 1000], function (saveIndex) {
            $body.on('click', '.pretty-button, .approve-button', function () {
                var $this = $(this);
                if ($this.hasClass('positive') || $this.hasClass('approve-button')) {
                    self.manager.unlock(saveIndex, 1);
                }
            });
        });

        // Mod mail
        self.manager.registerSeries(["hic sunt dracones", "just checkin' the mail", "dear mister postman", "You've got mail!"], "Checked mod mail {0} times!", [1, 100, 1000, 10000], function (saveIndex) {
            if (TB.utils.isModmail) {
                self.manager.unlock(saveIndex, 1);
            }
        });

        // Empty queue
        self.manager.registerSeries(["kitteh get!", "Dr. Jan Itor", "/u/Kylde"], "Cleared your queues {0} times!", [10, 700, 1500], function (saveIndex) {
            if (TBUtils.isModpage && $body.find('p#noresults').length > 0) {
                self.manager.unlock(saveIndex, 1);
            }
        });

        self.manager.register("being awesome", "As always, toolbox loves you", function (saveIndex) {
            var awesome = 7,
                chanceOfBeingAwesome = Math.floor((Math.random() * 50) + 1);

            self.log("You rolled a: " + chanceOfBeingAwesome);
            if (awesome == chanceOfBeingAwesome) {
                self.manager.unlock(saveIndex);
            }

        });
        
        self.manager.register("not dead yet", "Spent a week away from reddit.", function (saveIndex) {
            var now = TBUtils.getTime(),
                timeSince = now - lastSeen,
                daysSince = TBUtils.daysToMilliseconds(timeSince);
            
            if(daysSince >= 7) {
                self.manager.unlock(saveIndex);
            }

            self.setting('last_seen', now);
        });
    };

    TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        achievements();
    });
})();
