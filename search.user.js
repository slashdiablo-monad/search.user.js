// ==UserScript==
// @include http://slashdiablo.no-ip.org/tradelist.php
// @include http://slashdiablo.no-ip.org/tradesubmit.php
// @match http://slashdiablo.no-ip.org/tradelist.php
// @match http://slashdiablo.no-ip.org/tradesubmit.php
// ==/UserScript==
(function(){
/**
 * Load scripts dynamically, and then run everything().
 * This should be rewritten as '<script src="...">' if this is integrated with the real website,
 * and the contents of everything() put in their own js file.
 */
function bootstrap() {
    // http://stackoverflow.com/questions/2588513/why-doesnt-jquery-work-in-chrome-user-scripts-greasemonkey
    var load,execute,loadAndExecute;load=function(a,b,c){var d;d=document.createElement("script"),d.setAttribute("src",a),b!=null&&d.addEventListener("load",b),c!=null&&d.addEventListener("error",c),document.body.appendChild(d);return d},execute=function(a){var b,c;typeof a=="function"?b="("+a+")();":b=a,c=document.createElement("script"),c.textContent=b,document.body.appendChild(c);return c},loadAndExecute=function(a,b){return load(a,function(){return execute(b)})};

    //console.log('bootstrap');
    load('https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js', function() {
        //console.log('load jq');
        loadAndExecute('https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js', everything);
    });
}

/**
 * The interesting parts. Build an autocomplete menu.
 */
function everything() {
    /**
     * Associate searchable text with entries in a dropdown menu.
     *
     * Searches look like "type > quality > specific" ; for example
     * "orbs > unique > the oculus". Searches aren't case-sensitive.
     */
    function SearchIndex() {
        this._text_to_properties = {};
        this._texts = [];
    }

    SearchIndex.prototype.getTexts = function() {
        // defensive copy
        var ret = [];
        for (var i in this._texts) {
            ret.push(this._texts[i]);
        }
        return ret;
    };

    SearchIndex.prototype.getPropertiesForText = function(text) {
        return this._text_to_properties[text.toLowerCase()];
    };

    SearchIndex.prototype._indexItem = function(type_name, quality_name, specific, search_text) {
        if (!search_text) {
            search_text = [type_name, quality_name, specific].join(' > ')
        }
        var properties = {
            type:type_name,
            quality:quality_name,
            specific:specific
        };
        this._text_to_properties[search_text.toLowerCase()] = properties;
        this._texts.push(search_text);
    };

    SearchIndex.prototype._indexRuneword = function(specific) {
        var quality_name = 'Runeword';
        var search_text = [quality_name, specific].join(' > ')
        return this._indexItem(null, quality_name, specific, search_text);
    };

    SearchIndex.fromMasterItemList = function(items, runewords) {
        var ret = new SearchIndex();
        for (var type_name in items) {
            var types = items[type_name];
            for (var quality_name in types) {
                var qualities = types[quality_name];
                for (var specific_index=0; specific_index < qualities.length; specific_index++) {
                    var specific = qualities[specific_index];
                    ret._indexItem(type_name, quality_name, specific);
                }
            }
        }
        for (var runeword_index=0; runeword_index < runewords.length; runeword_index++) {
            var runeword = runewords[runeword_index];
            ret._indexRuneword(runeword);
        }
        return ret;
    };

    function appendScript(src, onload) {
        var script = window.document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', src);
        if (onload) {
            script.addEventListener('load', onload);
        }
        window.document.body.appendChild(script);
        return script;
    }

    function main() {
        // Search index for all items.
        var search = SearchIndex.fromMasterItemList(arrMasterItemList, arrPossibleRunewords);
        //console.log('indexed');

        // Style for the autocompleter. It would be nice to put this in a real <style> tag or css file, instead of appending with javascript.
        var style = jQuery('<style>');
        style.text('.searchbox{width:200px;}.ui-autocomplete{max-height:100px;overflow-y:auto;overflow-x:hidden;background:white;color:black;width:auto;position:absolute;cursor:default;list-style-type:none;}');
        $('body').append(style);
        // Create and configure the autocompleter.
        // http://jqueryui.com/demos/autocomplete/
        var searchbox = jQuery('<input>');
        searchbox.addClass('searchbox');
        searchbox.autocomplete({
            //delay: 0,
            source: search.getTexts()
        });
        function change(){
            var text = $(this).val();
            var properties = search.getPropertiesForText(text);
            if (!properties) {
                //console.log('skipping', text);
                return;
            }
            //console.log('changing', text, properties);
            // Update the select menus.
            // Fire onchange manually for each update, so we don't have to wait each time.
            // tradelist.php:
            $('#select_TradingList_Type').val(properties.type).change();
            $('#select_TradingList_Quality').val(properties.quality).change();
            $('#select_TradingList_Specific').val(properties.specific).change();
            // tradesubmit.php:
            $('#selectType').val(properties.type).change();
            $('#selectQuality').val(properties.quality).change();
            $('#selectSpecific').val(properties.specific).change();
        }
        searchbox.bind({
            'change':change,
            'keyup':change
        });
        searchbox.appendTo('h1');
        searchbox.focus();
        //console.log('done');
    }

///////////////////////////////////////////////////////////////////////////////
// Copy-paste from slashdiablo.no-ip.org/script.php
// (it sure would be nice if these were global)
///////////////////////////////////////////////////////////////////////////////
var arrPossibleRunewords = ["Ancient's Pledge", "Beast", "Black", "Bone", "Bramble", "Brand", "Breath of the Dying", "Call To Arms", "Chains of Honor", "Chaos", "Crescent Moon", "Death", "Delirium", "Destruction", "Doom", "Dragon", "Dream", "Duress", "Edge", "Enigma", "Enlightenment", "Eternity", "Exile", "Faith", "Famine", "Fortitude", "Fury", "Gloom", "Grief", "Hand of Justice", "Harmony", "Heart of the Oak", "Holy Thunder", "Honor", "Ice", "Infinity", "Insight", "King's Grace", "Kingslayer", "Last Wish", "Lawbringer", "Leaf", "Lionheart", "Lore", "Malice", "Melody", "Memory", "Myth", "Nadir", "Oath", "Obedience", "Passion", "Peace", "Phoenix", "Pride", "Principle", "Prudence", "Radiance", "Rain", "Rhyme", "Rift", "Sanctuary", "Silence", "Smoke", "Spirit", "Splendor", "Stealth", "Steel", "Stone", "Strength", "Treachery", "Venom", "Voice of Reason", "Wealth", "White", "Wind", "Wrath", "Zephyr"];

var arrMasterItemList ={
    "Armor":
    {
        "Normal":["Ancient Armor", "Archon Plate", "Balrog Skin", "Boneweave", "Breast Plate", "Chain Mail", "Chaos Armor", "Cuirass", "Demonhide Armor", "Diamond Mail", "Dusk Shroud", "Embossed Plate", "Field Plate", "Full Plate Mail", "Ghost Armor", "Gothic Plate", "Great Hauberk", "Hard Leather Armor", "Hellforge Plate", "Kraken Shell", "Lacquered Plate", "Leather Armor", "Light Plate", "Linked Mail", "Loricated Mail", "Mage Plate", "Mesh Armor", "Ornate Plate", "Plate Mail", "Quilted Armor", "Ring Mail", "Russet Armor", "Sacred Armor", "Scale Mail", "Scarab Husk", "Serpentskin Armor", "Shadow Plate", "Sharktooth Armor", "Splint Mail", "Studded Leather", "Templar Coat", "Tigulated Mail", "Trellised Armor", "Wire Fleece", "Wyrmhide"],
        "Unique":["Arkaine's Valor", "Atma's Wail", "Black Hades", "Blinkbat's Form", "Boneflesh", "Corpsemourn", "Crow Caw", "Darkglow", "Duriel's Shell", "Goldskin", "Greyform", "Guardian Angel", "Hawkmail", "Heavenly Garb", "Iceblink", "Iron Pelt", "Leviathan", "Ormus' Robes", "Que-Hegan's Wisdom", "Rattlecage", "Rockfleece", "Shaftstop", "Silks of the Victor", "Skin of the Flayed One", "Skin of the Vipermagi", "Skullder's Ire", "Sparking Mail", "Spirit Forge", "Steel Carapace", "Templar's Might", "The Centurion", "The Gladiator's Bane", "The Spirit Shroud", "Toothrow", "Twitchthroe", "Tyrael's Might", "Venom Ward"],
        "Set":["Aldur's Deception", "Arcanna's Flesh", "Arctic Furs", "Berserker's Hauberk", "Cathan's Mesh", "Cow King's Hide", "Dark Adherent", "Griswold's Heart", "Haemosu's Adamant", "Hwanin's Refuge", "Immortal King's Soul Cage", "Isenhart's Case", "M'avina's Embrace", "Milabrega's Robe", "Naj's Light Plate", "Natalya's Shadow", "Sazabi's Ghost Liberator", "Sigon's Shelter", "Tal Rasha's Guardianship", "Tancred's Spine", "Trang-Oul's Scales", "Vidala's Ambush"]
    },
    "Belt":
    {
        "Normal":["Battle Belt", "Belt", "Colossus Girdle", "Demonhide Sash", "Heavy Belt", "Light Belt", "Mesh Belt", "Mithril Coil", "Plated Belt", "Sash", "Sharkskin Belt", "Spiderweb Sash", "Troll Belt", "Vampirefang Belt", "War Belt"],
        "Unique":["Arachnid Mesh", "Bladebuckle", "Gloom's Trap", "Goldwrap", "Lenymo", "Nightsmoke", "Nosferatu's Coil", "Razortail", "Snakecord", "Snowclash", "String of Ears", "Thundergod's Vigor", "Verdungo's Hearty Cord"],
        "Set":["Arctic Binding", "Credendum", "Death's Guard", "Hsarus' Iron Stay", "Hwanin's Blessing", "Immortal King's Detail", "Infernal Sign", "Iratha's Cord", "M'avina's Tenet", "Sigon's Wrap", "Tal Rasha's Fine-Spun Cloth", "Trang-Oul's Girth", "Wilhelm's Pride"]
    },
    "Boot":
    {
        "Normal":["Battle Boots", "Boneweave Boots", "Boots", "Chain Boots", "Demonhide Boots", "Greaves", "Heavy Boots", "Light Plated Boots", "Mesh Boots", "Mirrored Boots", "Myrmidon Greaves", "Scarabshell Boots", "Sharkskin Boots", "War Boots", "Wyrmhide Boots"],
        "Unique":["Goblin Toe", "Gore Rider", "Gorefoot", "Hotspur", "Infernostride", "Marrowwalk", "Sandstorm Trek", "Shadow Dancer", "Silkweave", "Tearhaunch", "Treads of Cthon", "War Traveler", "Waterwalk"],
        "Set":["Aldur's Advance", "Cow King's Hooves", "Hsarus' Iron Heel", "Immortal King's Pillar", "Natalya's Soul", "Rite of Passage", "Sander's Riprap", "Sigon's Sabot", "Tancred's Hobnails", "Vidala's Fetlock"]
    },
    "Glove":
    {
        "Normal":["Battle Gauntlets", "Bramble Mitts", "Chain Gloves", "Crusader Gauntlets", "Demonhide Gloves", "Gauntlets", "Heavy Bracers", "Heavy Gloves", "Leather Gloves", "Light Gauntlets", "Ogre Gauntlets", "Sharkskin Gloves", "Vambraces", "Vampirebone Gloves", "War Gauntlets"],
        "Unique":["Bloodfist", "Chance Guards", "Dracul's Grasp", "Frostburn", "Ghoulhide", "Gravepalm", "Hellmouth", "Lava Gout", "Magefist", "Soul Drainer", "Steelrend", "The Hand of Broc", "Venom Grip"],
        "Set":["Arctic Mitts", "Cleglaw's Pincers", "Death's Hand", "Immortal King's Forge", "Iratha's Cuff", "Laying of Hands", "M'avina's Icy Clutch", "Magnus' Skin", "Sander's Taboo", "Sigon's Gage", "Trang-Oul's Claws"]
    },
    "Helm":
    {
        "Normal":["Alpha Helm", "Antlers", "Armet", "Assault Helmet", "Avenger Guard", "Basinet", "Blood Spirit", "Bone Helm", "Bone Visage", "Cap", "Carnage Helm", "Casque", "Circlet", "Conqueror Crown", "Corona", "Coronet", "Crown", "Death Mask", "Demonhead", "Destroyer Helm", "Diadem", "Dream Spirit", "Earth Spirit", "Falcon Mask", "Fanged Helm", "Full Helm", "Fury Visor", "Giant Conch", "Grand Crown", "Great Helm", "Griffon Headdress", "Grim Helm", "Guardian Crown", "Hawk Helm", "Helm", "Horned Helm", "Hunter's Guise", "Hydraskull", "Jawbone Cap", "Jawbone Visor", "Lion Helm", "Mask", "Rage Mask", "Sacred Feathers", "Sallet", "Savage Helmet", "Shako", "Skull Cap", "Sky Spirit", "Slayer Guard", "Spired Helm", "Spirit Mask", "Sun Spirit", "Tiara", "Totemic Mask", "War Hat", "Winged Helm", "Wolf Head"],
        "Unique":["Andariel's Visage", "Arreat's Face", "Biggin's Bonnet", "Blackhorn's Face", "Cerebus' Bite", "Coif of Glory", "Crown of Ages", "Crown of Thieves", "Darksight Helm", "Demonhorn's Edge", "Duskdeep", "Giant Skull", "Griffon's Eye", "Halaberd's Reign", "Harlequin Crest", "Howltusk", "Jalal's Mane", "Kira's Guardian", "Nightwing's Veil", "Peasant Crown", "Ravenlore", "Rockstopper", "Spirit Keeper", "Stealskull", "Steel Shade", "Tarnhelm", "The Face of Horror", "Undead Crown", "Valkyrie Wing", "Vampire Gaze", "Veil of Steel", "Wolfhowl", "Wormskull"],
        "Set":["Aldur's Stony Gaze", "Angelic Mantle", "Arcanna's Head", "Berserker's Headgear", "Cathan's Visage", "Cow King's Horns", "Griswold's Valor", "Guillaume's Face", "Hwanin's Splendor", "Immortal King's Will", "Infernal Cranium", "Iratha's Coil", "Isenhart's Horns", "M'avina's True Sight", "Milabrega's Diadem", "Naj's Circlet", "Natalya's Totem", "Ondal's Almighty", "Sander's Paragon", "Sazabi's Mental Sheath", "Sigon's Visor", "Tal Rasha's Horadric Crest", "Tancred's Skull", "Trang-Oul's Guise"]
    },
    "Shield":
    {
        "Normal":["Aegis", "Aerin Shield", "Akaran Rondache", "Akaran Targe", "Ancient Shield", "Barbed Shield", "Blade Barrier", "Bloodlord Skull", "Bone Shield", "Buckler", "Cantor Trophy", "Crown Shield", "Defender", "Demon Head", "Dragon Shield", "Fetish Trophy", "Gargoyle Head", "Gilded Shield", "Gothic Shield", "Grim Shield", "Heater", "Hellspawn Skull", "Heraldic Shield", "Hierophant Trophy", "Hyperion", "Kite Shield", "Kurast Shield", "Large Shield", "Luna", "Minion Skull", "Monarch", "Mummified Trophy", "Overseer Skull", "Pavise", "Preserved Head", "Protector Shield", "Rondache", "Round Shield", "Royal Shield", "Sacred Rondache", "Sacred Targe", "Scutum", "Sexton Trophy", "Small Shield", "Spiked Shield", "Succubus Skull", "Targe", "Tower Shield", "Troll Nest", "Unraveller Head", "Vortex Shield", "Ward", "Zakarum Shield", "Zombie Head"],
        "Unique":["Alma Negra", "Blackoak Shield", "Boneflame", "Bverrit Keep", "Darkforce Spawn", "Dragonscale", "Gerke's Sanctuary", "Head Hunter's Glory", "Herald Of Zakarum", "Homunculus", "Lance Guard", "Lidless Wall", "Medusa's Gaze", "Moser's Blessed Circle", "Pelta Lunata", "Radament's Sphere", "Spike Thorn", "Spirit Ward", "Steelclash", "Stormchaser", "Stormguild", "Stormshield", "Swordback Hold", "The Ward", "Tiamat's Rebuke", "Umbral Disk", "Visceratuant", "Wall of the Eyeless"],
        "Set":["Civerb's Ward", "Cleglaw's Claw", "Griswold's Honor", "Hsarus' Iron Fist", "Isenhart's Parry", "Milabrega's Orb", "Sigon's Guard", "Taebaek's Glory", "Trang-Oul's Wing", "Whitstan's Guard"]
    },
    "Axe":
    {
        "Normal":["Ancient Axe", "Axe", "Battle Axe", "Bearded Axe", "Broad Axe", "Cleaver", "Crowbill", "Double Axe", "Giant Axe", "Gothic Axe", "Great Axe", "Hand Axe", "Hatchet", "Large Axe", "Military Axe", "Military Pick", "Naga", "Tabar", "Twin Axe", "War Axe"],
        "Unique":["Axe of Fechmar", "Bladebone", "Boneslayer Blade", "Brainhew", "Butcher's Pupil", "Coldkill", "Cranebeak", "Death Cleaver", "Deathspade", "Ethereal Edge", "Executioner's Justice", "Goreshovel", "Guardian Naga", "Hellslayer", "Humongous", "Islestrike", "Messerschmidt's Reaver", "Pompeii's Wrath", "Rakescar", "Razor's Edge", "Rune Master", "Skull Splitter", "Spellsteel", "Stormrider", "The Chieftain", "The Gnasher", "The Minotaur", "Warlord's Trust"],
        "Set":["Berserker's Hatchet", "Tancred's Crowbill"]
    },
    "Bow":
    {
        "Normal":["Ashwood Bow", "Blade Bow", "Cedar Bow", "Ceremonial Bow", "Composite Bow", "Crusader Bow", "Diamond Bow", "Double Bow", "Edge Bow", "Gothic Bow", "Grand Matron Bow", "Great Bow", "Hunter's Bow", "Hydra Bow", "Large Siege Bow", "Long Battle Bow", "Long Bow", "Long War Bow", "Matriarchal Bow", "Razor Bow", "Reflex Bow", "Rune Bow", "Shadow Bow", "Short Battle Bow", "Short Bow", "Short Siege Bow", "Short War Bow", "Spider Bow", "Stag Bow", "Ward Bow"],
        "Unique":["Blastbark", "Blood Raven's Charge", "Cliffkiller", "Eaglehorn", "Endlesshail", "Goldstrike Arch", "Hellclap", "Kuko Shakaku", "Lycander's Aim", "Magewrath", "Pluckeye", "Raven Claw", "Riphook", "Rogue's Bow", "Skystrike", "Stormstrike", "Widowmaker", "Windforce", "Witchwild String", "Witherstring", "Wizendraw"],
        "Set":["Arctic Horn", "M'avina's Caster", "Vidala's Barb"]
    },
    "Crossbow":
    {
        "Normal":["Arbalest", "Ballista", "Chu-Ko-Nu", "Colossus Crossbow", "Crossbow", "Demon Crossbow", "Gorgon Crossbow", "Heavy Crossbow", "Light Crossbow", "Pellet Bow", "Repeating Crossbow", "Siege Crossbow"],
        "Unique":["Buriza-Do Kyanon", "Demon Machine", "Doomslinger", "Gut Siphon", "Hellcast", "Hellrack", "Ichorsting", "Langer Briser", "Leadcrow", "Pus Spitter"]
    },
    "Dagger":
    {
        "Normal":["Blade", "Bone Knife", "Cinquedeas", "Dagger", "Dirk", "Fanged Knife", "Kris", "Legend Spike", "Mithril Point", "Poignard", "Rondel", "Stiletto"],
        "Unique":["Blackbog's Sharp", "Fleshripper", "Ghostflame", "Gull", "Heart Carver", "Spectral Shard", "Spineripper", "Stormspike", "The Diggler", "The Jade Tan Do", "Wizardspike"]
    },
    "Javelin":
    {
        "Normal":["Balrog Spear", "Ceremonial Javelin", "Ghost Glaive", "Glaive", "Great Pilum", "Harpoon", "Hyperion Javelin", "Javelin", "Maiden Javelin", "Matriarchal Javelin", "Pilum", "Short Spear", "Simbilan", "Spiculum", "Stygian Pilum", "Throwing Spear", "War Javelin", "Winged Harpoon"],
        "Unique":["Thunderstroke", "Titan's Revenge", "Wraith Flight", "Gargoyle's Bite", "Demon's Arch"]
    },
    "Katar":
    {
        "Normal":["Battle Cestus", "Blade Talons", "Cestus", "Claws", "Fascia", "Feral Claws", "Greater Claws", "Greater Talons", "Hand Scythe", "Hatchet Hands", "Katar", "Quhab", "Runic Talons", "Scissors Katar", "Scissors Quhab", "Scissors Suwayyah", "Suwayyah", "War Fist", "Wrist Blade", "Wrist Spike", "Wrist Sword"],
        "Unique":["Bartuc's Cut-Throat", "Firelizard's Talons", "Jade Talon", "Shadow Killer"],
        "Set":["Natalya's Mark"]
    },
    "Mace":
    {
        "Normal":["Barbed Club", "Battle Hammer", "Club", "Cudgel", "Devil Star", "Flail", "Flanged Mace", "Great Maul", "Jagged Star", "Knout", "Legendary Mallet", "Mace", "Martel de Fer", "Maul", "Morning Star", "Ogre Maul", "Reinforced Mace", "Scourge", "Spiked Club", "Thunder Maul", "Truncheon", "Tyrant Club", "War Club", "War Hammer"],
        "Unique":["Baezil's Vortex", "Baranar's Star", "Bloodrise", "Bloodtree Stump", "Bonesnap", "Crushflange", "Dark Clan Crusher", "Demon Limb", "Earth Shifter", "Earthshaker", "Felloak", "Fleshrender", "Horizon's Tornado", "Ironstone", "Moonfall", "Nord's Tenderizer", "Schaefer's Hammer", "Steeldriver", "Stone Crusher", "Stormlash", "Stoutnail", "Sureshrill Frost", "The Cranium Basher", "The Gavel Of Pain", "The General's Tan Do Li Ga", "Windhammer"],
        "Set":["Aldur's Rhythm", "Dangoon's Teaching", "Immortal King's Stone Crusher"]
    },
    "Orb":
    {
        "Normal":["Clasped Orb", "Cloudy Sphere", "Crystalline Globe", "Demon Heart", "Dimensional Shard", "Eagle Orb", "Eldritch Orb", "Glowing Orb", "Heavenly Stone", "Jared's Stone", "Sacred Globe", "Smoked Sphere", "Sparkling Ball", "Swirling Crystal", "Vortex Orb"],
        "Unique":["Death's Fathom", "Eschuta's Temper", "The Oculus"],
        "Set":["Tal Rasha's Lidless Eye"]
    },
    "Polearm":
    {
        "Normal":["Bardiche", "Battle Scythe", "Bec-De-Corbin", "Bill", "Colossus Voulge", "Cryptic Axe", "Giant Thresher", "Great Poleaxe", "Grim Scythe", "Halberd", "Lochaber Axe", "Ogre Axe", "Partizan", "Poleaxe", "Scythe", "Thresher", "Voulge", "War Scythe"],
        "Unique":["Athena's Wrath", "Blackleach Blade", "Bonehew", "Dimoak's Hew", "Grim's Burning Dead", "Husoldal Evo", "Pierre Tombale Couant", "Soul Harvest", "Steelgoad", "Stormspire", "The Battlebranch", "The Grim Reaper", "The Meat Scraper", "The Reaper's Toll", "Tomb Reaver", "Woestave"],
        "Set":["Hwanin's Justice"]
    },
    "Scepter":
    {
        "Normal":["Caduceus", "Divine Scepter", "Grand Scepter", "Holy Water Sprinkler", "Mighty Scepter", "Rune Scepter", "Scepter", "Seraph Rod", "War Scepter"],
        "Unique":["Astreon's Iron Ward", "Hand of Blessed Light", "Heaven's Light", "Knell Striker", "Rusthandle", "Stormeye", "The Fetid Sprinkler", "The Redeemer", "Zakarum's Hand"],
        "Set":["Civerb's Cudgel", "Griswold's Redemption", "Milabrega's Rod"]
    },
    "Spear":
    {
        "Normal":["Brandistock", "Ceremonial Pike", "Ceremonial Spear", "Fuscina", "Ghost Spear", "Hyperion Spear", "Lance", "Maiden Pike", "Maiden Spear", "Mancatcher", "Matriarchal Pike", "Matriarchal Spear", "Pike", "Spear", "Spetum", "Stygian Pike", "Trident", "War Fork", "War Pike", "War Spear", "Yari"],
        "Unique":["Arioc's Needle", "Bloodthief", "Hone Sundan", "Kelpie Snare", "Lance of Yaggai", "Lycander's Flank", "Razortine", "Soulfeast Tine", "Spire of Honor", "Steel Pillar", "Stoneraven", "The Dragon Chang", "The Impaler", "The Tannr Gorerod", "Viperfork"]
    },
    "Stave":
    {
        "Normal":["Archon Staff", "Battle Staff", "Cedar Staff", "Elder Staff", "Gnarled Staff", "Gothic Staff", "Jo Staff", "Long Staff", "Quarterstaff", "Rune Staff", "Shillelagh", "Short Staff", "Stalagmite", "Walking Stick", "War Staff"],
        "Unique":["Bane Ash", "Chromatic Ire", "Mang Song's Lesson", "Ondal's Wisdom", "Razorswitch", "Ribcracker", "Serpent Lord", "Skull Collector", "Spire of Lazarus", "The Iron Jang Bong", "The Salamander", "Warpspear"],
        "Set":["Arcanna's Deathwand", "Cathan's Rule", "Naj's Puzzler"]
    },
    "Sword":
    {
        "Normal":["Ancient Sword", "Ataghan", "Balrog Blade", "Bastard Sword", "Battle Sword", "Broad Sword", "Champion Sword", "Claymore", "Colossus Blade", "Colossus Sword", "Conquest Sword", "Cryptic Sword", "Crystal Sword", "Cutlass", "Dacian Falx", "Dimensional Blade", "Elegant Blade", "Espandon", "Executioner Sword", "Falcata", "Falchion", "Flamberge", "Giant Sword", "Gladius", "Gothic Sword", "Great Sword", "Highland Blade", "Hydra Edge", "Legend Sword", "Long Sword", "Mythical Sword", "Phase Blade", "Rune Sword", "Sabre", "Scimitar", "Shamshir", "Short Sword", "Tulwar", "Tusk Sword", "Two-handed Sword", "War Sword", "Zweihander"],
        "Unique":["Azurewrath", "Bing Sz Wang", "Blacktongue", "Blade Of Ali Baba", "Blood Crescent", "Bloodletter", "Bloodmoon", "Cloudcrack", "Coldsteel Eye", "Crainte Vomir", "Culwen's Point", "Djinn Slayer", "Doombringer", "Flamebellow", "Frostwind", "Ginther's Rift", "Gleamscythe", "Griswold's Edge", "Headstriker", "Hellplague", "Hexfire", "Kinemil's Awl", "Lightsabre", "Plague Bearer", "Ripsaw", "Rixot's Keen", "Shadowfang", "Skewer of Krintiz", "Soulflay", "Swordguard", "The Atlantean", "The Grandfather", "The Patriarch", "The Vile Husk", "Todesfaelle Flamme"],
        "Set":["Angelic Sickle", "Bul-Kathos' Sacred Charge", "Bul-Kathos' Tribced Knife", "Battle Dart", "Flying Axe", "Flying Knife", "Francisca", "Hurlbat", "Throwing Axe", "Throwing Knife", "War Dart", "Winged Axe", "Winged Knife"],
        "Unique":["Deathbit", "Gimmershred", "Lacerator", "The Scalper", "Warshrike"]
    },
    "Wand":
    {
        "Normal":["Bone Wand", "Burnt Wand", "Ghost Wand", "Grave Wand", "Grim Wand", "Lich Wand", "Petrified Wand", "Polished Wand", "Tomb Wand", "Unearthed Wand", "Wand", "Yew Wand"],
        "Unique":["Arm of King Leoric", "Blackhand Key", "Boneshade", "Carin Shard", "Death's Web", "Gravenspine", "Maelstrom", "Suicide Branch", "Torch of Iro", "Ume's Lament"],
        "Set":["Infernal Torch", "Sander's Superstition"]
    },
    "Jewel":
    {
        "Normal":["N/A"],
        "Unique":["Cold Facet", "Fire Facet", "Light Facet", "Poison Facet"]
    },
    "Ring":
    {
        "Normal":["N/A"],
        "Unique":["Bul-Kathos' Wedding Band", "Carrion Wind", "Dwarf Star", "Manald Heal", "Nagelring", "Nature's Peace", "Raven Frost", "Stone of Jordan", "Wisp Projector"],
        "Set":["Angelic Halo", "Cathan's Seal"]
    },
    "Amulet":
    {
        "Normal":["N/A"],
        "Unique":["Atma's Scarab", "Crescent Moon", "Highlord's Wrath", "Mara's Kaleidoscope", "Metalgrid", "Nokozan Relic", "Saracen's Chance", "Seraph's Hymn", "The Cat's Eye", "The Eye of Etlich", "The Mahim-Oak Curio", "The Rising Sun"],
        "Set":["Angelic Wings", "Arcanna's Sign", "Cathan's Sigil", "Civerb's Icon", "Iratha's Collar", "Tal Rasha's Adjudication", "Tancred's Weird", "Telling of Beads", "Vidala's Snare"]
    },
    "Charm":
    {
        "Normal":["Small", "Large", "Grand"],
        "Unique":["Annihilus", "Gheed's Fortune", "Hellfire Torch"]
    },
    "Essence":
    {
        "Normal":["Charged Essence of Hatred", "Burning Essence of Terror", "Festering Essence of Destruction", "Twisted Essence of Suffering", "Token of Absolution"]
    },
    "Uber Drop":
    {
        "Normal":["Baal's Eye", "Diablo's Horn", "Mephisto's Brain", "Organ Set (all 3)"]
    },
    "Key":
    {
        "Normal":["Key of Destruction", "Key of Hate", "Key of Terror", "Key Set (all 3)"]
    },
    "Gem":
    {
        "Normal":["Perfect Gem (any)", "Chipped Amethyst", "Flawed Amethyst", "Normal Amethyst", "Flawless Amethyst", "Perfect Amethyst", "Chipped Diamond", "Flawed Diamond", "Normal Diamond", "Flawless Diamond", "Perfect Diamond", "Chipped Emerald", "Flawed Emerald", "Normal Emerald", "Flawless Emerald", "Perfect Emerald", "Chipped Ruby", "Flawed Ruby", "Normal Ruby", "Flawless Ruby", "Perfect Ruby", "Chipped Sapphire", "Flawed Sapphire", "Normal Sapphire", "Flawless Sapphire", "Perfect Sapphire", "Chipped Topaz", "Flawed Topaz", "Normal Topaz", "Flawless Topaz", "Perfect Topaz", "Chipped Skull", "Flawed Skull", "Normal Skull", "Flawless Skull", "Perfect Skull"]
    },
    "Rune":
    {
        "Normal":["El", "Eld", "Tir", "Nef", "Eth", "Ith", "Tal", "Ral", "Ort", "Thul", "Amn", "Sol", "Shael", "Dol", "Hel", "Io", "Lum", "Ko", "Fal", "Lem", "Pul", "Um", "Mal", "Ist", "Gul", "Vex", "Ohm", "Lo", "Sur", "Ber", "Jah", "Cham", "Zod"]
    },
    "Full Set":
    {
        "Set":["Aldur's Watchtower", "Angelic Raiment", "Arcanna's Tricks", "Arctic Gear", "Berserker's Arsenal", "Bul-Kathos' Children", "Cathan's Traps", "Civerb's Vestments", "Cleglaw's Brace", "Cow King's Leathers", "Death's Disguise", "Griswold's Legacy", "Heaven's Brethren", "Hsarus' Defense", "Hwanin's Majesty", "Immortal King", "Infernal Tools", "Iratha's Finery", "Isenhart's Armory", "M'avina's Battle Hymn", "Milabrega's Regalia", "Naj's Ancient Vestige", "Natalya's Odium", "Orphan's Call", "Sander's Folly", "Sazabi's Grand Tribute", "Sigon's Complete Steel", "Tal Rasha's Wrappings", "Tancred's Battlegear", "The Disciple", "Trang-Oul's Avatar", "Vidala's Rig"]
    },
};
///////////////////////////////////////////////////////////////////////////////
// END copy-paste from slashdiablo.no-ip.org/script.php
///////////////////////////////////////////////////////////////////////////////
    main();
};
    bootstrap();
})();
