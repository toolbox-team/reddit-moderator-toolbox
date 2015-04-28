function achievements() {
    var self = new TB.Module('Achievements');
    self.shortname = 'Achievements';

    // Default settings
    self.settings['enabled']['default'] = true;

    self.register_setting('save', {
        'type': 'achievement_save',
        'default': ''
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
            this.register(title, description, 1, achievement);
        };
        
        this.register = function(titles, description, maxValues, achievement) {
            function createRegister(title, maxValue, saveIndex) {
                self.log("Registering Achievement" );
                if (TB.utils.devMode) self.log(" name=" + title); // spoilers
                self.log("  maxValue=" + maxValue);
                self.log("  saveIndex=" + saveIndex);
                
                return {
                    title: title,
                    descr: description.format(maxValue),
                    maxValue: maxValue,
                    saveIndex: saveIndex
                };
            }
            
            var saveValue = 0;
            if (saveIndex < saves.length) {
                saveValue = saves[saveIndex];
            }
            else {
                saves.push(saveValue);
            }
            
            var achievementsBlock = [];
            if(maxValues instanceof Array && titles instanceof Array) {
                for(var i = 0; i < maxValues.length; i++) {
                    var a = createRegister(titles[i], maxValues[i], saveIndex);
                    achievementsBlock.push(a);
                }
            }
            else {
                achievementsBlock.push(createRegister(titles, maxValues, saveIndex));
            }
            achievements.push(achievementsBlock);
            
            achievement(saveIndex);
            saveIndex++;
        };
        
        this.unlock = function(saveIndex, value) {
            self.log("Unlocking achievement block: index="+saveIndex+", value="+value);
            if(value === undefined) {
                value = 1;
            }
            var old = saves[saveIndex];
            self.log("  Old value: "+saves[saveIndex]);
            saves[saveIndex] += value;
            self.log("  New value: "+saves[saveIndex]);
            this.save();

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

        // Achievement definitions
        self.log("Registering achievements");

        // approving stuff
        self.manager.register(["too nice", "way too nice", "big softie"], "Approved {0} things", [50, 200, 1000], function (saveIndex) {
            $body.on('click', '.pretty-button, .approve-button', function () {
                var $this = $(this);
                if ($this.hasClass('positive') || $this.hasClass('approve-button')) {
                    self.manager.unlock(saveIndex, 1);
                }
            });
        });

        // Mod mail
        self.manager.register(["hic sunt dracones", "just checkin' the mail", "dear mister postman", "You've got mail!"], "Checked mod mail {0} times!", [1, 100, 1000, 10000], function (saveIndex) {
            if (TB.utils.isModmail) {
                self.manager.unlock(saveIndex, 1);
            }
        });

        // Empty queue
        self.manager.register(["kitteh get!", "Dr. Jan Itor", "/u/Kylde"], "Cleared your queues {0} times!", [10, 700, 1500], function (saveIndex) {
            if (TBUtils.isModpage && $body.find('p#noresults')) {
                self.manager.unlock(saveIndex, 1);
            }
        });

        self.manager.register(["", "", ""], "", [1, 2, 3], function (saveIndex) {

        });
        self.manager.register(["", "", ""], "", [1, 2, 3], function (saveIndex) {

        });
    };

    TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        achievements();
    });
})();
