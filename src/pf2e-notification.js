import Settings from "./settings.js";

function heldItems(actor) {
    if (!actor) return []
    return Object.values(actor?.itemTypes).flat(1).filter(a=>a.handsHeld > 0);
}

function hasFreeHand(actor) {
    return heldItems(actor).map(a=>a.handsHeld).reduce((a, b) => a + b, 0) < 2;
}

function hasCondition(actor, con) {
    return actor && actor?.itemTypes?.condition?.find((c => con === c.slug))
}

function hasEffectBySourceId(actor, eff) {
    return actor?.itemTypes?.effect?.find(c => eff === c.sourceId)
}

function isCleric(actor) {
    return actor?.class?.slug == "cleric";
}

function isBard(actor) {
    return actor?.class?.slug == "bard";
}

function isDruid(actor) {
    return actor?.class?.slug == "druid";
}

function isOracle(actor) {
    return actor?.class?.slug == "oracle";
}

function isPsychic(actor) {
    return actor?.class?.slug == "psychic";
}

function isSummoner(actor) {
    return actor?.class?.slug == "summoner";
}

function heldSymbol(actor) {
    return heldItems(actor).filter(a=>a.slug.startsWith("religious-symbol")).length > 0;
}

function heldMusicalInstrument(actor) {
    return heldItems(actor).filter(a=>a.slug.startsWith("musical-instrument") || a.slug.startsWith("maestros-instrument")).length > 0;
}

function heldMistletoe(actor) {
    return heldItems(actor).filter(a=>a.slug.includes("mistletoe")).length > 0;
}

Hooks.once("init", () => {
    Settings.register();
});

Hooks.on('updateItem', async (item, system, diff, _id) => {
    if (game?.combats?.active || game.settings.get("pf2e-notification", "ignoreEncounterCheck")) {
        if (game.user.isGM || item?.actor?.isOwner) {
            if (system?.system?.equipped?.handsHeld >= 0) {
                checkHands(item?.actor);
            }
        }
    }
});

function checkHands(actor) {
    const bb = heldItems(actor);
    const a = bb.map(a=>a.handsHeld).reduce((a, b) => a + b, 0)
    if (a > 2) {
        const desc = ' '+bb.map(a=>`${a.name} - ${a.handsHeld} hand` + (a.handsHeld == 1 ? '' : 's')).join(', ')
        ui.notifications.info(`${actor?.name} uses more then 2 hands.` + desc);
    }
}

Hooks.on('preCreateChatMessage',(message, user, _options, userId)=>{
    if ((game?.combats?.active || game.settings.get("pf2e-notification", "ignoreEncounterCheck")) && message?.actor?.type == "character") {
        if ('attack-roll' == message?.flags?.pf2e?.context?.type && message.item && message.item?.type === 'weapon') {
            if (!message.item.isHeld && message.item.slug != "basic-unarmed") {
                ui.notifications.info(`${message?.item?.actor?.name} attacks with a weapon that is not held.`);
            } else if (parseInt(message.item.handsHeld) < parseInt(message.item.hands)) {
                ui.notifications.info(`${message?.item?.actor?.name} attacks with a weapon that held incorrectly.`);
            }
        }
        if (Settings.handleSpell) {
            if (message?.flags?.pf2e?.casting || "spell-cast" == message?.flags?.pf2e?.context?.type) {
                if (message?.item?.castingTraits?.includes("manipulate")) {
                    if (hasCondition(message?.actor, 'restrained')) {
                        ui.notifications.info(`${message?.actor?.name} can not casts spell ${message?.item?.name} when restrained.`);
                    }
                    if (message?.item?.system?.components?.material && !hasFreeHand(message?.actor)) {
                        var showMsg = true
                        if (isCleric(message?.actor) && heldSymbol(message?.actor)) {
                            showMsg = false;
                        }
                        if (isBard(message?.actor) && heldMusicalInstrument(message?.actor)) {
                            showMsg = false;
                        }
                        if (isDruid(message?.actor) && heldMistletoe(message?.actor)) {
                            showMsg = false;
                        }
                        if (isOracle(message?.actor) || isPsychic(message?.actor) || isSummoner(message?.actor)) {
                            showMsg = false;
                        }
                        if (showMsg) {
                            ui.notifications.info(`${message?.actor?.name} can not casts spell ${message?.item?.name} because need free hand for spell with material components.`);
                        }
                    }
                }
            }
        }

        if (hasEffectBySourceId(message?.actor, "Compendium.pf2e.feat-effects.Item.z3uyCMBddrPK5umr")) {
            if (message.item && message.item.slug != 'seek' && message.item.traits.has('concentrate') && !message.item.traits.has('rage')) {
                ui.notifications.info(`${message.actor?.name} might not be able to do this action because under rage effect.`);
            }
        }
    }
});

Hooks.on('pf2e.startTurn', (combatant, encounter, id) => {
    if (game.settings.get("pf2e-notification", "ignoreEncounterCheck")) {
        checkHands(combatant.actor)
    }
})