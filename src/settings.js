export default class Settings {
    static get handleSpell() {
        return game.settings.get("pf2e-notification", "handle-spell");
    }
    static register() {
        game.settings.register("pf2e-notification", "handle-spell", {
            name: 'Handle spell notifications',
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
        });
        game.settings.register("pf2e-notification", "ignoreEncounterCheck", {
            name: "Ignore encounter check.",
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
        });
    }

}