Hooks.on('updateItem', async (item, system, diff, _id) => {
    if (game?.combats?.active) {
        if (game.user.isGM || token.combatant.players.find(a=>a.id==game.user.id)) {
            if (system?.system?.equipped?.handsHeld >= 0) {
                var bb = Object.values(item?.actor?.itemTypes).flat(1).filter(a=>a.handsHeld > 0);
                var a = bb.map(a=>a.handsHeld).reduce((a, b) => a + b, 0)
                if (a > 2) {
                    var desc = ' '+bb.map(a=>`${a.name} - ${a.handsHeld} hand` + (a.handsHeld == 1 ? '' : 's')).join(', ')
                    ui.notifications.info(`${item?.actor?.name} uses more then 2 hands.` + desc);
                }
            }
        }
    }
});

Hooks.on('preCreateChatMessage',(message, user, _options, userId)=>{
    if (game?.combats?.active) {
        if ('attack-roll' == message?.flags?.pf2e?.context?.type) {
            if (!message.item.isHeld || (parseInt(message.item.handsHeld) < parseInt(message.item.hands))) {
                ui.notifications.info(`${message?.item?.actor?.name} attacks with a weapon that is not held.`);
            }
        }
    }
});